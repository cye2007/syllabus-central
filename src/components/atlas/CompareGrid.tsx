import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight, CalendarClock, Clock, DoorOpen, Loader2, MapPin, Pencil, PieChart, Sparkles, User, UserCheck,
  type LucideIcon,
} from "lucide-react";
import { colorBg, colorSoft, daysUntil, fmtDate, type Course, type Fact, type Item } from "@/lib/courses";
import { ALL_DAYS, meetingDays, policyStatus, type PolicyStatus } from "@/lib/overview";
import { SourceChip } from "@/components/atlas/SourceViewer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Policy = { category: string; title: string; text: string; page: number | null };
type Weight = { component: string; weight: number | null; page: number | null };

const ov = (c: Course, key: string) => ((c.overview ?? {}) as Record<string, Fact>)[key] ?? null;
const policiesOf = (c: Course) => (c.policies ?? []) as Policy[];
const weightsOf = (c: Course) => ((((c.grading ?? {}) as any).weights ?? []) as Weight[]).filter((w) => w.weight != null);

type Row = { key: string; label: string; icon: LucideIcon; render: (c: Course, items: Item[]) => ReactNode };

const Missing = () => <span className="text-xs text-muted-foreground/60">— Not in syllabus</span>;

function FactCell({ c, k, children }: { c: Course; k: string; children?: (v: string) => ReactNode }) {
  const f = ov(c, k);
  if (!f?.value) return <Missing />;
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1 text-sm leading-snug">{children ? children(f.value) : f.value}</div>
      <SourceChip course={c} page={f.page} />
    </div>
  );
}

const STATUS: Record<PolicyStatus, { label: string; dot: string }> = {
  allowed: { label: "Allowed", dot: "bg-success" },
  limited: { label: "With limits", dot: "bg-warning" },
  not_allowed: { label: "Not allowed", dot: "bg-destructive" },
  unclear: { label: "Unclear", dot: "bg-muted-foreground/40" },
};

function PolicyCell({ c, cat }: { c: Course; cat: string }) {
  const p = policiesOf(c).find((x) => x.category === cat);
  if (!p) return <Missing />;
  const s = STATUS[policyStatus(p.text)];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
          <span className={cn("h-2 w-2 rounded-full", s.dot)} /> {s.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{p.title}</p>
          <SourceChip course={c} page={p.page} />
        </div>
        <p className="mt-1.5 text-sm leading-relaxed">{p.text}</p>
      </PopoverContent>
    </Popover>
  );
}

const ROWS: Row[] = [
  { key: "professor", label: "Professor", icon: User, render: (c) => (
    <FactCell c={c} k="professor">{(v) => (
      <span className="flex items-center gap-2">
        <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold", colorSoft[c.color])}>
          {v.replace(/^(dr|prof)\.?\s*/i, "").split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <span className="truncate">{v}</span>
      </span>
    )}</FactCell>
  ) },
  { key: "meets", label: "Meets", icon: Clock, render: (c) => (
    <FactCell c={c} k="meeting_times">{(v) => {
      const days = meetingDays(v);
      return (
        <div className="space-y-1.5">
          {days.length > 0 && (
            <div className="flex gap-1">
              {ALL_DAYS.map((d) => (
                <span key={d} className={cn("grid h-6 w-7 place-items-center rounded text-[10px] font-semibold",
                  days.includes(d) ? cn(colorBg[c.color], "text-background") : "bg-muted text-muted-foreground/50")}>{d}</span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{v}</p>
        </div>
      );
    }}</FactCell>
  ) },
  { key: "location", label: "Location", icon: MapPin, render: (c) => <FactCell c={c} k="location" /> },
  { key: "office_hours", label: "Office hours", icon: DoorOpen, render: (c) => (
    <FactCell c={c} k="office_hours">{(v) => <span className="line-clamp-2 text-xs">{v}</span>}</FactCell>
  ) },
  { key: "grading", label: "Grading", icon: PieChart, render: (c) => {
    const ws = weightsOf(c);
    if (!ws.length) return <Missing />;
    const total = ws.reduce((s, w) => s + (w.weight ?? 0), 0);
    return (
      <div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {ws.map((w, k) => (
            <div key={k} className={cn("h-full border-r border-background last:border-0", colorBg[c.color])}
              style={{ width: `${w.weight}%`, opacity: 1 - (k / Math.max(1, ws.length)) * 0.65 }} title={`${w.component}: ${w.weight}%`} />
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
          {ws.slice(0, 3).map((w, k) => <span key={k}>{w.component} <span className="font-mono text-foreground">{w.weight}%</span></span>)}
          {ws.length > 3 && <span>+{ws.length - 3}</span>}
          {Math.abs(total - 100) >= 0.5 && <span className="font-mono text-warning">Σ {total}%</span>}
        </div>
      </div>
    );
  } },
  { key: "late_work", label: "Late work", icon: Pencil, render: (c) => <PolicyCell c={c} cat="late_work" /> },
  { key: "attendance", label: "Attendance", icon: UserCheck, render: (c) => <PolicyCell c={c} cat="attendance" /> },
  { key: "ai_usage", label: "AI use", icon: Sparkles, render: (c) => <PolicyCell c={c} cat="ai_usage" /> },
  { key: "next", label: "Next due", icon: CalendarClock, render: (_c, items) => {
    const n = items.find((i) => i.due_date && daysUntil(i.due_date) >= 0 && i.kind !== "reading");
    if (!n) return <span className="text-xs text-muted-foreground/60">Nothing upcoming</span>;
    const d = daysUntil(n.due_date!);
    return (
      <div className="flex items-center gap-2">
        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px]",
          d <= 2 ? "bg-destructive/10 text-destructive" : d <= 7 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground")}>
          {fmtDate(n.due_date)}
        </span>
        <span className="truncate text-sm">{n.title}</span>
      </div>
    );
  } },
];

function CourseHead({ c }: { c: Course }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        {c.code && <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-medium", colorSoft[c.color])}>{c.code}</span>}
        <Link to="/courses/$id" params={{ id: c.id }} className="mt-1 line-clamp-2 block font-display text-base font-semibold leading-snug hover:underline">
          {c.name}
        </Link>
      </div>
      <Link to="/courses/$id" params={{ id: c.id }} aria-label={`Open ${c.name}`}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-foreground hover:text-background">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function cellFor(row: Row, c: Course, items: Item[]) {
  if (c.status === "processing") return row.key === "professor" ? <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Reading PDF…</span> : null;
  if (c.status === "failed") return row.key === "professor" ? <span className="text-xs text-destructive">Couldn't read this PDF</span> : null;
  return row.render(c, items);
}

export function CompareGrid({ courses, items }: { courses: Course[]; items: Item[] }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [mobileRow, setMobileRow] = useState(ROWS[0].key);
  const rows = ROWS.filter((r) => !hidden.includes(r.key));
  const itemsOf = (c: Course) => items.filter((i) => i.course_id === c.id);
  const cols = `150px repeat(${courses.length}, minmax(230px, 1fr))`;

  return (
    <section className="fade-up">
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Show:</span>
        {ROWS.map((r) => {
          const on = !hidden.includes(r.key);
          return (
            <button key={r.key} onClick={() => setHidden((h) => (on ? [...h, r.key] : h.filter((x) => x !== r.key)))}
              className={cn("hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors md:flex",
                on ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
              <r.icon className="h-3 w-3" /> {r.label}
            </button>
          );
        })}
        {ROWS.map((r) => (
          <button key={`m-${r.key}`} onClick={() => setMobileRow(r.key)}
            className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] md:hidden",
              mobileRow === r.key ? "bg-foreground text-background" : "text-muted-foreground")}>
            <r.icon className="h-3 w-3" /> {r.label}
          </button>
        ))}
      </div>

      {/* Desktop: aligned grid */}
      <div className="hidden overflow-x-auto rounded-2xl border bg-card shadow-soft md:block">
        <div className="grid min-w-max" style={{ gridTemplateColumns: cols }}>
          <div className="sticky left-0 top-0 z-20 border-b bg-card" />
          {courses.map((c) => (
            <div key={c.id} className="relative border-b border-l bg-card p-4 pt-5">
              <div className={cn("absolute inset-x-0 top-0 h-1", colorBg[c.color])} />
              <CourseHead c={c} />
            </div>
          ))}
          {rows.map((r, ri) => (
            <div key={r.key} className="contents group/row">
              <div className={cn("sticky left-0 z-10 flex items-start gap-2 bg-card px-4 py-3.5 text-xs font-medium text-muted-foreground", ri < rows.length - 1 && "border-b")}>
                <r.icon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {r.label}
              </div>
              {courses.map((c) => (
                <div key={c.id} className={cn("min-w-0 border-l px-4 py-3.5 transition-colors group-hover/row:bg-muted/30", ri < rows.length - 1 && "border-b")}>
                  {cellFor(r, c, itemsOf(c))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: one row type at a time */}
      <div className="space-y-2 md:hidden">
        {courses.map((c) => {
          const r = ROWS.find((x) => x.key === mobileRow)!;
          return (
            <div key={c.id} className="relative overflow-hidden rounded-xl border bg-card p-4 pl-5 shadow-soft">
              <div className={cn("absolute inset-y-0 left-0 w-1", colorBg[c.color])} />
              <CourseHead c={c} />
              <div className="mt-3">{cellFor(r, c, itemsOf(c))}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
