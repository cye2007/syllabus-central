import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { colorBg, colorSoft, type Course, type Item } from "@/lib/courses";
import { SourceChip } from "./SourceViewer";
import { cn } from "@/lib/utils";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function MonthCalendar({ items, courses, compact = false }: { items: Item[]; courses: Course[]; compact?: boolean }) {
  const dated = items.filter((i) => i.due_date);
  const [cursor, setCursor] = useState(() => {
    const today = new Date();
    const next = dated.map((i) => i.due_date!).sort().find((d) => d >= iso(today));
    const base = next ? new Date(next) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const byId = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c])), [courses]);
  const byDate = useMemo(() => {
    const m: Record<string, Item[]> = {};
    for (const i of dated) (m[i.due_date!] ??= []).push(i);
    return m;
  }, [dated]);

  const start = new Date(cursor);
  start.setDate(1 - start.getDay());
  const days = Array.from({ length: 42 }, (_, k) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + k));
  const todayIso = iso(new Date());

  return (
    <div className="rounded-xl border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-display text-xl">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">{compact ? d[0] : d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, k) => {
          const key = iso(d);
          const evs = byDate[key] ?? [];
          const graded = evs.filter((e) => e.kind !== "reading");
          const overlap = graded.length > 1;
          const inMonth = d.getMonth() === cursor.getMonth();
          const cell = (
            <div
              className={cn(
                "relative border-b border-r p-1.5 text-left transition-colors",
                compact ? "min-h-14" : "min-h-24",
                (k + 1) % 7 === 0 && "border-r-0",
                !inMonth && "bg-muted/40 text-muted-foreground/50",
                evs.length > 0 && "cursor-pointer hover:bg-muted/60",
                overlap && "bg-warning/10",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full text-xs",
                    key === todayIso && "bg-accent font-semibold text-accent-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                {overlap && <AlertTriangle className="h-3 w-3 text-warning" />}
              </div>
              {compact ? (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {evs.slice(0, 4).map((e) => (
                    <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", colorBg[byId[e.course_id]?.color ?? "slate"])} />
                  ))}
                </div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <div key={e.id} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium", colorSoft[byId[e.course_id]?.color ?? "slate"])}>
                      {e.title}
                    </div>
                  ))}
                  {evs.length > 3 && <div className="px-1 text-[10px] text-muted-foreground">+{evs.length - 3} more</div>}
                </div>
              )}
            </div>
          );
          if (!evs.length) return <div key={key}>{cell}</div>;
          return (
            <Popover key={key}>
              <PopoverTrigger asChild>{cell}</PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="border-b px-3 py-2 text-sm font-medium">
                  {d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  {overlap && <span className="ml-2 text-xs text-warning">· {graded.length} deadlines overlap</span>}
                </div>
                <div className="max-h-72 space-y-1 overflow-auto p-2">
                  {evs.map((e) => {
                    const c = byId[e.course_id];
                    return (
                      <div key={e.id} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted">
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-sm", colorBg[c?.color ?? "slate"])} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{e.title}</p>
                          {c && (
                            <Link to="/courses/$id" params={{ id: c.id }} className="text-xs text-muted-foreground hover:underline">
                              {c.code || c.name} · {e.kind}
                            </Link>
                          )}
                        </div>
                        {c && <SourceChip course={c} page={e.source_page} />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
