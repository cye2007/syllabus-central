import { useEffect, useState } from "react";
import { DoorOpen, Mail, ChevronDown } from "lucide-react";
import { colorBg, type Course, type Fact } from "@/lib/courses";
import { parseOfficeHours, fmtMin, ALL_DAYS, type OfficeHours } from "@/lib/overview";
import { SourceLink } from "@/components/atlas/SourceViewer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAY_NAMES: Record<string, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday" };
const JS_DAY = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Entry = { course: Course; oh: OfficeHours; page: number | null; who: string | null; email: string | null };

function fact(c: Course, k: string): Fact | null {
  const o = (c.overview ?? {}) as Record<string, Fact | undefined>;
  return o[k] && o[k]!.value ? o[k]! : null;
}

function EmailBtn({ e }: { e: Entry }) {
  if (!e.email) return null;
  const subj = encodeURIComponent(`${e.course.code || e.course.name} office hours question`);
  return (
    <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
      <a href={`mailto:${e.email}?subject=${subj}`}><Mail className="h-3 w-3" /> Email</a>
    </Button>
  );
}

function Row({ e, status }: { e: Entry; status?: "now" | "later" | "ended" | null }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className={cn("mt-1 h-8 w-1", colorBg[e.course.color] ?? colorBg["slate"])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {e.course.code || e.course.name}
          {e.who && <span className="font-normal text-muted-foreground"> · {e.who}</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          <SourceLink course={e.course} page={e.page}>{e.oh.raw}</SourceLink>
        </p>
      </div>
      {status && (
        <span className={cn("px-2 py-0.5 text-[11px] font-medium",
          status === "now" ? "bg-success/15 text-success" : status === "later" ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground")}>
          {status === "now" ? "Happening now" : status === "later" ? `Later · ${fmtMin(e.oh.start!)}` : "Ended"}
        </span>
      )}
      <EmailBtn e={e} />
    </div>
  );
}

export function HelpToday({ courses }: { courses: Course[] }) {
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const entries: Entry[] = [];
  const missing: Course[] = [];
  for (const c of courses.filter((c) => c.status !== "processing")) {
    const f = fact(c, "office_hours");
    const oh = parseOfficeHours(f?.value);
    if (!oh) { missing.push(c); continue; }
    entries.push({ course: c, oh, page: f?.page ?? null, who: fact(c, "professor")?.value ?? null, email: fact(c, "email")?.value ?? null });
  }
  const scheduled = entries.filter((e) => e.oh.days.length > 0);
  const ask = entries.filter((e) => e.oh.days.length === 0);

  const today = now ? JS_DAY[now.getDay()]! : null;
  const mins = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const todays = scheduled.filter((e) => today && e.oh.days.includes(today))
    .sort((a, b) => (a.oh.start ?? 9999) - (b.oh.start ?? 9999));
  const status = (e: Entry) => e.oh.start == null || e.oh.end == null ? null
    : mins < e.oh.start ? "later" : mins < e.oh.end ? "now" : "ended";

  // Next available slot if nothing today
  let next: { day: string; e: Entry } | null = null;
  if (now && todays.length === 0) {
    for (let k = 1; k <= 7 && !next; k++) {
      const d = JS_DAY[(now.getDay() + k) % 7]!;
      const e = scheduled.find((x) => x.oh.days.includes(d));
      if (e) next = { day: d, e };
    }
  }

  if (courses.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl"><DoorOpen className="h-5 w-5 text-muted-foreground" /> Help today</h2>
        {now && <span className="text-xs text-muted-foreground">{now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</span>}
      </div>
      <div className="divide-y border bg-card shadow-soft">
        {todays.length === 0 ? (
          <div className="px-4 py-4 text-sm">
            <p className="font-medium">No office hours today</p>
            {next && <p className="mt-0.5 text-xs text-muted-foreground">Next: {DAY_NAMES[next.day]} · {next.e.course.code || next.e.course.name}</p>}
          </div>
        ) : todays.map((e) => <Row key={e.course.id} e={e} status={status(e)} />)}

        {scheduled.length > 0 && (
          <div>
            <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              Rest of the week <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            </button>
            {open && ALL_DAYS.filter((d) => d !== today).map((d) => {
              const list = scheduled.filter((e) => e.oh.days.includes(d));
              if (!list.length) return null;
              return (
                <div key={d} className="border-t">
                  <p className="px-4 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{DAY_NAMES[d]}</p>
                  {list.map((e) => <Row key={e.course.id} e={e} />)}
                </div>
              );
            })}
          </div>
        )}

        {ask.length > 0 && (
          <div>
            <p className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ask to schedule</p>
            {ask.map((e) => <Row key={e.course.id} e={e} />)}
          </div>
        )}

        {missing.length > 0 && (
          <p className="px-4 py-2.5 text-xs text-muted-foreground">
            Not in syllabus: {missing.map((c) => c.code || c.name).join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}
