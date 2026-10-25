import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, BookOpen, CalendarClock, Loader2, Plus, Sparkles, FileWarning } from "lucide-react";
import { coursesQuery, itemsQuery, issuesQuery, colorBg, colorSoft, colorBorder, daysUntil, fmtDate, overlappingDates, parseDate } from "@/lib/courses";
import { MonthCalendar } from "@/components/atlas/MonthCalendar";
import { SourceChip } from "@/components/atlas/SourceViewer";
import { openUpload } from "@/components/atlas/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CourseAtlas" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(coursesQuery),
      context.queryClient.ensureQueryData(itemsQuery),
      context.queryClient.ensureQueryData(issuesQuery),
    ]),
  component: Dashboard,
});

function Dashboard() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: items } = useSuspenseQuery(itemsQuery);
  const { data: issues } = useSuspenseQuery(issuesQuery);
  const byId = Object.fromEntries(courses.map((c) => [c.id, c]));
  const upcoming = items
    .filter((i) => i.due_date && daysUntil(i.due_date) >= 0 && i.kind !== "reading")
    .slice(0, 8);
  const exams = upcoming.filter((i) => i.kind === "exam" || i.kind === "quiz");
  const overlaps = overlappingDates(items).filter(([d]) => daysUntil(d) >= 0);
  const openIssues = issues.filter((i) => i.status === "open");
  const undated = items.filter((i) => !i.due_date && i.kind !== "reading").length;

  // Workload heatmap: graded items per week, next 16 weeks
  const weeks = Array.from({ length: 16 }, (_, w) => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() - s.getDay() + w * 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 7);
    const n = items.filter((i) => i.due_date && i.kind !== "reading" && parseDate(i.due_date) >= s && parseDate(i.due_date) < e).length;
    return { s, n };
  });
  const max = Math.max(1, ...weeks.map((w) => w.n));

  if (courses.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center fade-up">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-5xl">Your semester, mapped.</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Upload your syllabi and CourseAtlas builds course pages, a unified calendar, and flags anything unclear.
        </p>
        <Button className="mt-8 gap-2" size="lg" onClick={openUpload}>
          <Plus className="h-4 w-4" /> Upload your first syllabus
        </Button>
      </div>
    );
  }

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div className="fade-up">
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-display text-4xl md:text-5xl">{greeting}.</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 fade-up">
        <Stat icon={BookOpen} label="Courses" value={courses.length} />
        <Stat icon={CalendarClock} label="Due in 7 days" value={upcoming.filter((i) => daysUntil(i.due_date!) <= 7).length} />
        <Stat icon={AlertTriangle} label="Overlapping days" value={overlaps.length} tone={overlaps.length ? "warn" : undefined} />
        <Stat icon={FileWarning} label="Open issues" value={openIssues.length} tone={openIssues.length ? "warn" : undefined} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Courses</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, k) => {
            const ci = items.filter((i) => i.course_id === c.id);
            const next = ci.find((i) => i.due_date && daysUntil(i.due_date) >= 0 && i.kind !== "reading");
            const ov = c.overview as any;
            return (
              <Link
                key={c.id}
                to="/courses/$id"
                params={{ id: c.id }}
                style={{ animationDelay: `${k * 40}ms` }}
                className="group relative overflow-hidden rounded-xl border bg-card p-4 shadow-soft card-hover fade-up"
              >
                <div className={cn("absolute inset-x-0 top-0 h-1", colorBg[c.color])} />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {c.code && <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-medium", colorSoft[c.color])}>{c.code}</span>}
                    <h3 className="mt-2 line-clamp-2 font-medium leading-snug">{c.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{ov?.professor?.value ?? (c.status === "ready" ? "Professor not listed" : "")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>
                <div className="mt-4 border-t pt-3 text-xs">
                  {c.status === "processing" ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Extracting…</span>
                  ) : c.status === "failed" ? (
                    <span className="text-destructive">Extraction failed — open to retry</span>
                  ) : next ? (
                    <span className="text-muted-foreground">
                      Next: <span className="text-foreground">{next.title}</span> · {fmtDate(next.due_date)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{ci.length} items · nothing upcoming</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Upcoming deadlines</h2>
            <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">Calendar →</Link>
          </div>
          <div className="divide-y rounded-xl border bg-card shadow-soft">
            {upcoming.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No dated upcoming deadlines.{undated > 0 && ` ${undated} items have no date in the syllabus.`}
              </p>
            )}
            {upcoming.map((i) => {
              const c = byId[i.course_id];
              const d = daysUntil(i.due_date!);
              const clash = overlaps.some(([od]) => od === i.due_date);
              return (
                <div key={i.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                  <div className="w-12 text-center">
                    <div className="text-[10px] uppercase text-muted-foreground">{parseDate(i.due_date!).toLocaleDateString(undefined, { month: "short" })}</div>
                    <div className="font-display text-2xl leading-none">{parseDate(i.due_date!).getDate()}</div>
                  </div>
                  <span className={cn("h-8 w-1 rounded-full", colorBg[c?.color ?? "slate"])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c?.code || c?.name} · <span className="capitalize">{i.kind}</span>
                      {i.weight != null && ` · ${i.weight}%`}
                    </p>
                  </div>
                  {clash && <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Overlapping deadline" />}
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", d <= 2 ? "bg-destructive/10 text-destructive" : d <= 7 ? "bg-warning/15 text-warning-foreground dark:text-warning" : "bg-muted text-muted-foreground")}>
                    {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d}d`}
                  </span>
                  {c && <SourceChip course={c} page={i.source_page} />}
                </div>
              );
            })}
          </div>
        </section>
        <div className="space-y-6 lg:col-span-2">
          {(overlaps.length > 0 || openIssues.length > 0) && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Alerts</h2>
              <div className="space-y-2">
                {overlaps.slice(0, 3).map(([d, its]) => (
                  <div key={d} className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                    <p className="font-medium">{its.length} deadlines on {fmtDate(d)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{its.map((i) => `${byId[i.course_id]?.code || byId[i.course_id]?.name}: ${i.title}`).join(" · ")}</p>
                  </div>
                ))}
                {openIssues.length > 0 && (
                  <Link to="/issues" className="block rounded-xl border bg-card p-3 text-sm shadow-soft card-hover">
                    <p className="font-medium">{openIssues.length} syllabus issues need review</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{openIssues[0].title}</p>
                  </Link>
                )}
              </div>
            </section>
          )}
          {exams.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Upcoming exams</h2>
              <div className="space-y-2">
                {exams.slice(0, 4).map((e) => (
                  <div key={e.id} className={cn("rounded-lg border border-l-4 bg-card px-3 py-2 text-sm", colorBorder[byId[e.course_id]?.color ?? "slate"])}>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{byId[e.course_id]?.code || byId[e.course_id]?.name} · {fmtDate(e.due_date)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Workload · next 16 weeks</h2>
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex h-20 items-end gap-1">
                {weeks.map((w, k) => (
                  <div key={k} className="group relative flex-1">
                    <div
                      className={cn("w-full rounded-sm transition-all", w.n === 0 ? "bg-muted" : w.n / max > 0.66 ? "bg-accent" : w.n / max > 0.33 ? "bg-accent/60" : "bg-accent/30")}
                      style={{ height: `${Math.max(6, (w.n / max) * 80)}px` }}
                      title={`Week of ${w.s.toLocaleDateString()}: ${w.n} items`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>This week</span>
                <span>+15 wks</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">This month</h2>
        <MonthCalendar items={items} courses={courses} compact />
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone?: "warn" | undefined }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", tone === "warn" && "text-warning")} /> {label}
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </div>
  );
}
