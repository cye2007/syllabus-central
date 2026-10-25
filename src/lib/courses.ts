import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Course = Tables<"courses">;
export type Item = Tables<"course_items">;
export type Issue = Tables<"course_issues">;

export type Fact = { value: string | null; page: number | null };

export const COURSE_COLORS = ["blue", "coral", "green", "amber", "violet", "teal", "rose", "slate"] as const;

// Literal class maps so Tailwind keeps them.
export const colorBg: Record<string, string> = {
  blue: "bg-course-blue", coral: "bg-course-coral", green: "bg-course-green", amber: "bg-course-amber",
  violet: "bg-course-violet", teal: "bg-course-teal", rose: "bg-course-rose", slate: "bg-course-slate",
};
export const colorSoft: Record<string, string> = {
  blue: "bg-course-blue/12 text-course-blue", coral: "bg-course-coral/12 text-course-coral",
  green: "bg-course-green/12 text-course-green", amber: "bg-course-amber/15 text-course-amber",
  violet: "bg-course-violet/12 text-course-violet", teal: "bg-course-teal/12 text-course-teal",
  rose: "bg-course-rose/12 text-course-rose", slate: "bg-course-slate/12 text-course-slate",
};
export const colorBorder: Record<string, string> = {
  blue: "border-l-course-blue", coral: "border-l-course-coral", green: "border-l-course-green", amber: "border-l-course-amber",
  violet: "border-l-course-violet", teal: "border-l-course-teal", rose: "border-l-course-rose", slate: "border-l-course-slate",
};

export const coursesQuery = queryOptions({
  queryKey: ["courses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("courses").select("*").order("created_at");
    if (error) throw error;
    return data as Course[];
  },
  refetchInterval: (q) => (q.state.data?.some((c) => c.status === "processing") ? 3000 : false),
});

export const itemsQuery = queryOptions({
  queryKey: ["items"],
  queryFn: async () => {
    const { data, error } = await supabase.from("course_items").select("*").order("due_date", { nullsFirst: false });
    if (error) throw error;
    return data as Item[];
  },
});

export const issuesQuery = queryOptions({
  queryKey: ["issues"],
  queryFn: async () => {
    const { data, error } = await supabase.from("course_issues").select("*").order("created_at");
    if (error) throw error;
    return data as Issue[];
  },
});

export async function signedPdfUrl(path: string) {
  const { data, error } = await supabase.storage.from("syllabi").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function parseDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function fmtDate(d: string | null) {
  if (!d) return "No date";
  return parseDate(d).toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });
}

export function daysUntil(d: string) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((parseDate(d).getTime() - t.getTime()) / 86400000);
}

/** Dates where 2+ graded items from any course fall on the same day. */
export function overlappingDates(items: Item[]) {
  const map = new Map<string, Item[]>();
  for (const i of items) {
    if (!i.due_date || i.kind === "reading") continue;
    map.set(i.due_date, [...(map.get(i.due_date) ?? []), i]);
  }
  return [...map.entries()].filter(([, v]) => v.length > 1).sort(([a], [b]) => a.localeCompare(b));
}
