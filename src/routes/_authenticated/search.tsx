import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowUp, FileSearch, Loader2 } from "lucide-react";
import { askAtlas } from "@/lib/ai.functions";
import { coursesQuery, colorBg } from "@/lib/courses";
import { SourceLink } from "@/components/atlas/SourceViewer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search syllabi — SyllaView" }] }),
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
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-display text-4xl">Find in your syllabi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across every uploaded course. Answers quote the source page so you can verify them.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="relative max-w-2xl">
        <FileSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Which classes allow late assignments?"
          className="w-full rounded-xl border bg-card py-3 pl-11 pr-12 text-sm shadow-soft outline-none transition-shadow focus:shadow-lift focus:ring-2 focus:ring-ring/30"
        />
        <button
          disabled={busy || !q.trim()}
          aria-label="Search"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </form>

      {results.length === 0 && !busy && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => run(e)} className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
              {e}
            </button>
          ))}
        </div>
      )}

      {busy && (
        <div className="max-w-3xl space-y-2 rounded-xl border bg-card p-5">
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      )}

      <div className="max-w-3xl space-y-3">
        {results.map((r, k) => (
          <div key={k} className="rounded-xl border bg-card p-5 shadow-soft fade-up">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{r.q}</p>
            {r.error ? (
              <p className="mt-3 text-sm text-destructive">{r.error}</p>
            ) : (
              <>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{r.answer.replace(/\*\*/g, "")}</p>
                {r.comparisons.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-lg border">
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
                              <td className="p-3">{course ? <SourceLink course={course} page={c.page}>{c.value}</SourceLink> : c.value}</td>
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
    </div>
  );
}
