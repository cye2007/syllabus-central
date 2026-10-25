import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Quote, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { coursesQuery, itemsQuery, issuesQuery, colorBg, fmtDate, overlappingDates, type Issue } from "@/lib/courses";
import { SourceChip } from "@/components/atlas/SourceViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/issues")({
  head: () => ({ meta: [{ title: "Review issues — CourseAtlas" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(coursesQuery),
      context.queryClient.ensureQueryData(itemsQuery),
      context.queryClient.ensureQueryData(issuesQuery),
    ]),
  component: IssuesPage,
});

const KIND: Record<string, string> = {
  contradiction: "Contradiction", grading_inconsistency: "Grading", missing_date: "Missing date", unclear_policy: "Unclear policy",
};

function IssuesPage() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: items } = useSuspenseQuery(itemsQuery);
  const { data: issues } = useSuspenseQuery(issuesQuery);
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const byId = Object.fromEntries(courses.map((c) => [c.id, c]));
  const list = issues.filter((i) => i.status === tab);
  const overlaps = overlappingDates(items);

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-display text-4xl">Review issues</h1>
        <p className="text-sm text-muted-foreground">
          Things the AI found contradictory, missing or unclear. Nothing is resolved automatically — you decide.
        </p>
      </div>

      {overlaps.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Cross-course deadline overlaps</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {overlaps.map(([d, its]) => (
              <div key={d} className="rounded-xl border border-warning/40 bg-warning/5 p-4">
                <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4 text-warning" /> {fmtDate(d)}</p>
                <div className="mt-2 space-y-1">
                  {its.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 text-sm">
                      <span className={cn("h-2 w-2 rounded-sm", colorBg[byId[i.course_id]?.color])} />
                      <span className="flex-1 truncate">{byId[i.course_id]?.code || byId[i.course_id]?.name}: {i.title}</span>
                      {byId[i.course_id] && <SourceChip course={byId[i.course_id]} page={i.source_page} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm w-fit">
        {(["open", "resolved"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-3 py-1 capitalize transition-colors", tab === t ? "bg-card shadow-soft" : "text-muted-foreground")}>
            {t} ({issues.filter((i) => i.status === t).length})
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-success" />
          <p className="mt-2 text-sm text-muted-foreground">{tab === "open" ? "No open issues. Nice." : "Nothing resolved yet."}</p>
        </div>
      )}
      <div className="space-y-3">
        {list.map((i) => <IssueCard key={i.id} issue={i} course={byId[i.course_id]} />)}
      </div>
    </div>
  );
}

function IssueCard({ issue, course }: { issue: Issue; course: any }) {
  const qc = useQueryClient();
  const [note, setNote] = useState(issue.resolution ?? "");
  const [open, setOpen] = useState(false);
  const sources = (issue.sources ?? []) as { quote: string; page: number | null }[];
  const set = async (status: string) => {
    const { error } = await supabase.from("course_issues").update({ status, resolution: status === "resolved" ? note || null : null }).eq("id", issue.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["issues"] });
    setOpen(false);
  };
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{KIND[issue.kind] ?? issue.kind}</Badge>
        {course && (
          <Link to="/courses/$id" params={{ id: course.id }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <span className={cn("h-2 w-2 rounded-sm", colorBg[course.color])} /> {course.code || course.name}
          </Link>
        )}
      </div>
      <h3 className="mt-2 font-medium">{issue.title}</h3>
      {issue.description && <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>}
      {sources.length > 0 && (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {sources.map((s, k) => (
            <div key={k} className="rounded-lg border-l-2 border-l-accent bg-muted/50 p-3 text-sm">
              <div className="flex items-start gap-2">
                <Quote className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <p className="flex-1 italic">{s.quote}</p>
                {course && <SourceChip course={course} page={s.page} />}
              </div>
            </div>
          ))}
        </div>
      )}
      {issue.status === "resolved" ? (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="flex-1 text-muted-foreground">{issue.resolution || "Marked resolved"}</span>
          <Button size="sm" variant="ghost" className="gap-1" onClick={() => set("open")}><RotateCcw className="h-3 w-3" /> Reopen</Button>
        </div>
      ) : open ? (
        <div className="mt-3 space-y-2">
          <Textarea placeholder="How did you resolve this? (e.g. Professor confirmed the exam is Oct 14)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => set("resolved")}>Mark resolved</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}>Resolve…</Button>
      )}
    </div>
  );
}
