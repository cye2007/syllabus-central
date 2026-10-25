import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { askAtlas } from "@/lib/ai.functions";
import { coursesQuery, colorBg } from "@/lib/courses";
import { SourceChip } from "@/components/atlas/SourceViewer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Ask Atlas — CourseAtlas" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(coursesQuery),
  component: SearchPage,
});

const EXAMPLES = [
  "Which classes allow late assignments?",
  "What exams do I have next week?",
  "Compare AI usage policies across my courses",
  "When are office hours for each professor?",
];

type Result = { q: string; answer: string; comparisons: { course_id: string; course: string; value: string; page: number | null }[]; error?: string };

function SearchPage() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const ask = useServerFn(askAtlas);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const byId = Object.fromEntries(courses.map((c) => [c.id, c]));

  async function run(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setQ("");
    try {
      const r = await ask({ data: { question } });
      setResults((s) => [{ q: question, ...r }, ...s]);
    } catch (e: any) {
      setResults((s) => [{ q: question, answer: "", comparisons: [], error: e.message }, ...s]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 fade-up">
      <div className="text-center">
        <h1 className="font-display text-4xl md:text-5xl">Ask across every syllabus</h1>
        <p className="mt-2 text-sm text-muted-foreground">Answers come only from your uploaded courses, with page references.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Which classes allow late assignments?"
          className="w-full rounded-2xl border bg-card px-5 py-4 pr-14 text-base shadow-soft outline-none transition-shadow focus:shadow-lift focus:ring-2 focus:ring-ring/30"
        />
        <button disabled={busy || !q.trim()} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </form>
      {results.length === 0 && !busy && (
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => run(e)} className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
              {e}
            </button>
          ))}
        </div>
      )}
      {busy && (
        <div className="space-y-2 rounded-2xl border bg-card p-5">
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}
      {results.map((r, k) => (
        <div key={k} className="rounded-2xl border bg-card p-5 shadow-soft fade-up">
          <p className="text-sm font-medium text-muted-foreground">{r.q}</p>
          {r.error ? (
            <p className="mt-3 text-sm text-destructive">{r.error}</p>
          ) : (
            <>
              <div className="mt-3 flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.answer.replace(/\*\*/g, "")}</p>
              </div>
              {r.comparisons.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {r.comparisons.map((c, j) => {
                        const course = byId[c.course_id];
                        return (
                          <tr key={j} className="align-top">
                            <td className="w-40 bg-muted/40 p-3">
                              {course ? (
                                <Link to="/courses/$id" params={{ id: course.id }} className="flex items-center gap-2 font-medium hover:underline">
                                  <span className={cn("h-2 w-2 shrink-0 rounded-sm", colorBg[course.color])} />
                                  {course.code || course.name}
                                </Link>
                              ) : (
                                c.course
                              )}
                            </td>
                            <td className="p-3">{c.value}</td>
                            <td className="w-16 p-3 text-right">{course && <SourceChip course={course} page={c.page} />}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
