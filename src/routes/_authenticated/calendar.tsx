import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { coursesQuery, itemsQuery, colorBg } from "@/lib/courses";
import { MonthCalendar } from "@/components/atlas/MonthCalendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — CourseAtlas" }] }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(coursesQuery), context.queryClient.ensureQueryData(itemsQuery)]),
  component: CalendarPage,
});

function exportIcs(items: { title: string; due_date: string | null; course: string }[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CourseAtlas//EN"];
  for (const i of items) {
    if (!i.due_date) continue;
    const d = i.due_date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT", `UID:${crypto.randomUUID()}@courseatlas`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${i.course}: ${i.title.replace(/[,;]/g, " ")}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  a.download = "courseatlas.ics";
  a.click();
}

function CalendarPage() {
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: items } = useSuspenseQuery(itemsQuery);
  const name = Object.fromEntries(courses.map((c) => [c.id, c.code || c.name]));
  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Calendar</h1>
          <p className="text-sm text-muted-foreground">Every dated event from every syllabus. Amber days have overlapping deadlines.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => exportIcs(items.map((i) => ({ ...i, course: name[i.course_id] ?? "" })))}>
          <Download className="h-4 w-4" /> Export .ics
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {courses.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-sm", colorBg[c.color])} /> {c.code || c.name}
          </span>
        ))}
      </div>
      <MonthCalendar items={items} courses={courses} />
    </div>
  );
}
