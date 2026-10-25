import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXTRACT_PROMPT = `You are a meticulous academic syllabus parser. Read the attached syllabus PDF and return ONLY a JSON object.
STRICT RULES:
- Never invent information. If something is not in the document, use null (or an empty array).
- For every fact include "page": the 1-based PDF page number where it appears.
- Dates must be ISO "YYYY-MM-DD" ONLY when the document states the full date unambiguously (infer the year only from the stated term). Otherwise date=null and keep the original wording in due_text.
- Do not resolve contradictions. Report them in "issues".

JSON shape:
{
 "name": string|null, "code": string|null, "term": string|null,
 "overview": {
   "professor": {"value": string|null, "page": int|null},
   "email": {"value": string|null, "page": int|null},
   "phone": {"value": string|null, "page": int|null},
   "office": {"value": string|null, "page": int|null},
   "office_hours": {"value": string|null, "page": int|null},
   "meeting_times": {"value": string|null, "page": int|null},
   "location": {"value": string|null, "page": int|null},
   "tas": {"value": string|null, "page": int|null},
   "description": {"value": string|null, "page": int|null}
 },
 "grading": {
   "weights": [{"component": string, "weight": number|null, "page": int|null}],
   "scale": [{"grade": string, "range": string, "page": int|null}],
   "notes": [{"text": string, "page": int|null}]
 },
 "items": [{"title": string, "kind": "assignment"|"exam"|"quiz"|"project"|"reading"|"other", "date": string|null, "due_text": string|null, "weight": number|null, "description": string|null, "page": int|null}],
 "schedule": [{"week": string, "date": string|null, "topic": string, "readings": string|null, "page": int|null}],
 "policies": [{"category": "attendance"|"late_work"|"ai_usage"|"academic_integrity"|"accommodations"|"other", "title": string, "text": string, "page": int|null}],
 "resources": [{"type": "textbook"|"link"|"material"|"software"|"other", "title": string, "detail": string|null, "required": boolean|null, "page": int|null}],
 "issues": [{"kind": "contradiction"|"grading_inconsistency"|"missing_date"|"unclear_policy", "title": string, "description": string, "sources": [{"quote": string, "page": int|null}]}]
}
Issue detection: flag deadlines stated differently in different places, grade weights that do not sum to 100%, assessments without dates, and vague/contradictory policies. Quote the original text in sources.`;

const COLORS = ["blue", "coral", "green", "amber", "violet", "teal", "rose", "slate"];

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

const isoOrNull = (d: unknown) =>
  typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)) ? d : null;

export const extractSyllabus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { courseId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { geminiJSON } = await import("./gemini.server");
    const { data: course, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", data.courseId)
      .single();
    if (error || !course) throw new Error("Course not found");

    const fail = async (msg: string) => {
      await supabase.from("courses").update({ status: "failed", error: msg }).eq("id", course.id);
      return { ok: false as const, error: msg };
    };

    try {
      await supabase.from("courses").update({ status: "processing", error: null }).eq("id", course.id);
      const { data: file, error: dlErr } = await supabase.storage
        .from("syllabi")
        .download(course.syllabus_path!);
      if (dlErr || !file) return await fail("Could not read the uploaded PDF.");
      const buf = await file.arrayBuffer();
      if (buf.byteLength === 0) return await fail("The PDF is empty.");
      const b64 = toBase64(buf);

      const out = await geminiJSON([
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACT_PROMPT },
            {
              type: "file",
              file: {
                filename: course.file_name ?? "syllabus.pdf",
                file_data: `data:application/pdf;base64,${b64}`,
              },
            },
          ],
        },
      ]);

      const { count } = await supabase.from("courses").select("id", { count: "exact", head: true });
      await supabase.from("course_items").delete().eq("course_id", course.id);
      await supabase.from("course_issues").delete().eq("course_id", course.id);

      const items = Array.isArray(out.items) ? out.items : [];
      if (items.length) {
        await supabase.from("course_items").insert(
          items.map((i: any) => ({
            course_id: course.id,
            title: String(i.title ?? "Untitled"),
            kind: String(i.kind ?? "assignment"),
            due_date: isoOrNull(i.date),
            due_text: i.due_text ?? null,
            weight: typeof i.weight === "number" ? i.weight : null,
            description: i.description ?? null,
            source_page: Number.isInteger(i.page) ? i.page : null,
          })),
        );
      }
      const issues = Array.isArray(out.issues) ? out.issues : [];
      if (issues.length) {
        await supabase.from("course_issues").insert(
          issues.map((i: any) => ({
            course_id: course.id,
            kind: String(i.kind ?? "unclear_policy"),
            title: String(i.title ?? "Issue"),
            description: i.description ?? null,
            sources: Array.isArray(i.sources) ? i.sources : [],
          })),
        );
      }

      await supabase
        .from("courses")
        .update({
          status: "ready",
          name: out.name || course.file_name?.replace(/\.pdf$/i, "") || "Untitled course",
          code: out.code ?? null,
          term: out.term ?? null,
          color: course.color === "blue" ? COLORS[((count ?? 1) - 1) % COLORS.length] : course.color,
          overview: out.overview ?? {},
          grading: out.grading ?? {},
          policies: out.policies ?? [],
          resources: out.resources ?? [],
          schedule: out.schedule ?? [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id);
      return { ok: true as const };
    } catch (e: any) {
      return await fail(e?.message || "Extraction failed.");
    }
  });

export const askAtlas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { question: string }) => {
    if (!input.question?.trim() || input.question.length > 500) throw new Error("Invalid question");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { geminiJSON } = await import("./gemini.server");
    const [{ data: courses }, { data: items }] = await Promise.all([
      supabase.from("courses").select("id,name,code,overview,grading,policies,resources,schedule").eq("status", "ready"),
      supabase.from("course_items").select("course_id,title,kind,due_date,due_text,weight,source_page"),
    ]);
    if (!courses?.length) return { answer: "Upload a syllabus first — there's nothing to search yet.", comparisons: [] };
    const kb = courses.map((c) => ({
      ...c,
      items: (items ?? []).filter((i) => i.course_id === c.id),
    }));
    const today = new Date().toISOString().slice(0, 10);
    try {
      const out = await geminiJSON([
        {
          role: "system",
          content: `You answer student questions using ONLY the provided JSON course data. Today is ${today}. If the data does not contain the answer, say so plainly. Never invent facts. Return JSON: {"answer": string (concise, markdown allowed), "comparisons": [{"course_id": string, "course": string, "value": string, "page": int|null}]}. Include one comparison row per relevant course when comparing across courses; otherwise an empty array.`,
        },
        { role: "user", content: `COURSE DATA (json):\n${JSON.stringify(kb)}\n\nQUESTION: ${data.question}` },
      ]);
      return {
        answer: String(out.answer ?? "No answer."),
        comparisons: Array.isArray(out.comparisons) ? out.comparisons : [],
      };
    } catch (e: any) {
      return { answer: "", comparisons: [], error: e?.message || "Search failed." };
    }
  });
