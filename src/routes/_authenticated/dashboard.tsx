import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, CalendarClock, Clock, FileText, FileWarning,
  Loader2, Mail, MapPin, Pencil, Plus, Sparkles, Upload, User, UserCheck,
} from "lucide-react";
import { coursesQuery, itemsQuery, issuesQuery, colorBg, colorSoft, daysUntil, fmtDate, overlappingDates, parseDate, type Course, type Fact, type Item } from "@/lib/courses";
import { SourceChip } from "@/components/atlas/SourceViewer";
import { openUpload } from "@/components/atlas/AppShell";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Semester overview — CourseAtlas" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(coursesQuery),
      context.queryClient.ensureQueryData(itemsQuery),
      context.queryClient.ensureQueryData(issuesQuery),
    ]),
  component: Dashboard,
});

type Policy = { category: string; title: string; text: string; page: number | null };
type Weight = { component: string; weight: number | null; page: number | null };

const ov = (c: Course, key: string) => ((c.overview ?? {}) as Record<string, Fact>)[key] ?? null;
const policiesOf = (c: Course) => (c.policies ?? []) as Policy[];
const weightsOf = (c: Course) => (((c.grading ?? {}) as any).weights ?? []) as Weight[];

const POLICY_CHIPS = [
  { cat: "late_work", label: "Late work", icon: Pencil },
  { cat: "attendance", label: "Attendance", icon: UserCheck },
  { cat: "ai_usage", label: "AI usage", icon: Sparkles },
] as const;

function Dashboard() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: items } = useSuspenseQuery(itemsQuery);
  const { data: issues } = useSuspenseQuery(issuesQuery);
  const byId = Object.fromEntries(courses.map((c) => [c.id, c]));
  const upcoming = items
    .filter((i) => i.due_date && daysUntil(i.due_date) >= 0 && i.kind !== "reading")
    .slice(0, 10);
  const overlaps = overlappingDates(items).filter(([d]) => daysUntil(d) >= 0);
  const openIssues = issues.filter((i) => i.status === "open");
  const undated = items.filter((i) => !i.due_date && i.kind !== "reading").length;

  // Workload: graded items per week, next 12 weeks
  const weeks = Array.from({ length: 12 }, (_, w) => {
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
        <div className="grid h-14 w-14 place-items-center rounded-2xl border bg-card shadow-soft">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-4xl md:text-5xl">Your semester at a glance</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Upload your course PDFs and CourseAtlas builds one overview of every class — professors, deadlines, grading and policies side by side.
        </p>
        <Button className="mt-8 gap-2" size="lg" onClick={openUpload}>
          <Upload className="h-4 w-4" /> Upload your first syllabus
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 fade-up">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Semester overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 && "s"} · {items.length} extracted items
            {openIssues.length > 0 && (
              <> · <Link to="/issues" className="text-warning hover:underline">{openIssues.length} issue{openIssues.length !== 1 && "s"} to review</Link></>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={openUpload}>
          <Plus className="h-4 w-4" /> Add syllabus
        </Button>
      </div>

      {/* Course cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c, k) => (
          <CourseCard key={c.id} course={c} items={items.filter((i) => i.course_id === c.id)} delay={k * 50} />
        ))}
      </section>

      {/* Deadlines + side column */}
      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl">Coming up</h2>
            <Link to="/calendar" className="text-xs text-muted-foreground hover:text-foreground">Full calendar →</Link>
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
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", d <= 2 ? "bg-destructive/10 text-destructive" : d <= 7 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground")}>
                    {d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d}d`}
                  </span>
                  {c && <SourceChip course={c} page={i.source_page} />}
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-8 lg:col-span-2">
          {(overlaps.length > 0 || openIssues.length > 0) && (
            <section>
              <h2 className="mb-3 font-display text-2xl">Needs attention</h2>
              <div className="space-y-2">
                {overlaps.slice(0, 3).map(([d, its]) => (
                  <div key={d} className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
                    <p className="font-medium">{its.length} deadlines on {fmtDate(d)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{its.map((i) => `${byId[i.course_id]?.code || byId[i.course_id]?.name}: ${i.title}`).join(" · ")}</p>
                  </div>
                ))}
                {openIssues.length > 0 && (
                  <Link to="/issues" className="block rounded-xl border bg-card p-3 text-sm shadow-soft card-hover">
                    <p className="flex items-center gap-2 font-medium"><FileWarning className="h-4 w-4 text-warning" /> {openIssues.length} syllabus issue{openIssues.length !== 1 && "s"} need review</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{openIssues[0]?.title}</p>
                  </Link>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-2xl">Workload · 12 weeks</h2>
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
                <span>+11 wks</span>
              </div>
            </div>
          </section>

          <section>
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Due in the next 7 days
              </div>
              <div className="mt-1 font-display text-3xl">{upcoming.filter((i) => daysUntil(i.due_date!) <= 7).length}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course: c, items, delay }: { course: Course; items: Item[]; delay: number }) {
  const facts = [
    { icon: User, fact: ov(c, "professor") },
    { icon: Clock, fact: ov(c, "meeting_times") },
    { icon: MapPin, fact: ov(c, "location") },
    { icon: Mail, fact: ov(c, "email") },
  ].filter((f) => f.fact?.value);
  const weights = weightsOf(c).filter((w) => w.weight != null);
  const total = weights.reduce((s, w) => s + (w.weight ?? 0), 0);
  const policies = policiesOf(c);
  const next = items.find((i) => i.due_date && daysUntil(i.due_date) >= 0 && i.kind !== "reading");

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-soft card-hover fade-up"
    >
      <div className={cn("h-1.5", colorBg[c.color])} />
      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {c.code && <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-medium", colorSoft[c.color])}>{c.code}</span>}
              {c.term && <span className="text-[11px] text-muted-foreground">{c.term}</span>}
            </div>
            <Link to="/courses/$id" params={{ id: c.id }} className="mt-1.5 line-clamp-2 font-display text-xl leading-snug hover:underline">
              {c.name}
            </Link>
          </div>
          <Link to="/courses/$id" params={{ id: c.id }} aria-label={`Open ${c.name}`}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-foreground hover:text-background">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {c.status === "processing" && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading PDF…</p>
        )}
        {c.status === "failed" && (
          <p className="mt-4 text-sm text-destructive">Couldn't read this PDF — open the course to retry.</p>
        )}

        {c.status === "ready" && (
          <>
            {/* Key facts */}
            <div className="mt-4 space-y-1.5">
              {facts.map((f, k) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <f.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{f.fact!.value}</span>
                  <span className="ml-auto shrink-0"><SourceChip course={c} page={f.fact!.page} /></span>
                </div>
              ))}
              {facts.length === 0 && <p className="text-sm italic text-muted-foreground">No course details extracted.</p>}
            </div>

            {/* Grading bar */}
            {weights.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Grading</span>
                  <span className={cn("font-mono", Math.abs(total - 100) >= 0.5 && "text-warning")}>Σ {total}%</span>
                </div>
                <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
                  {weights.map((w, k) => (
                    <div
                      key={k}
                      className={cn("h-full", colorBg[c.color])}
                      style={{ width: `${w.weight ?? 0}%`, opacity: 1 - (k / Math.max(1, weights.length)) * 0.65 }}
                      title={`${w.component}: ${w.weight}%`}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {weights.slice(0, 4).map((w, k) => (
                    <span key={k} className="text-[11px] text-muted-foreground">
                      {w.component} <span className="font-mono text-foreground">{w.weight}%</span>
                    </span>
                  ))}
                  {weights.length > 4 && <span className="text-[11px] text-muted-foreground">+{weights.length - 4} more</span>}
                </div>
              </div>
            )}

            {/* Policy chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {POLICY_CHIPS.map(({ cat, label, icon: Icon }) => {
                const p = policies.find((x) => x.category === cat);
                if (!p)
                  return (
                    <span key={cat} className="flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground/60">
                      <Icon className="h-3 w-3" /> {label}: —
                    </span>
                  );
                return (
                  <Popover key={cat}>
                    <PopoverTrigger asChild>
                      <button className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors", colorSoft[c.color], "hover:opacity-80")}>
                        <Icon className="h-3 w-3" /> {label}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">{p.title}</p>
                        <SourceChip course={c} page={p.page} />
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed">{p.text}</p>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>

            {/* Next deadline */}
            <div className="mt-auto pt-4">
              {next ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    Next: <span className="font-medium">{next.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(next.due_date)}</span>
                </div>
              ) : (
                <p className="px-1 text-xs text-muted-foreground">No upcoming deadlines</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
