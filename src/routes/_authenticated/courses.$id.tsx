import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Pencil, Check, X, Plus, Trash2, RefreshCw, FileText, Loader2, User, Mail, Phone, MapPin, Clock, Building2, Users, AlertTriangle, Calculator,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractSyllabus } from "@/lib/ai.functions";
import { coursesQuery, itemsQuery, issuesQuery, colorBg, colorSoft, fmtDate, COURSE_COLORS, type Course, type Fact, type Item } from "@/lib/courses";
import { SourceLink, useSource } from "@/components/atlas/SourceViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/courses/$id")({
  head: () => ({ meta: [{ title: "Course — CourseAtlas" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(coursesQuery),
      context.queryClient.ensureQueryData(itemsQuery),
      context.queryClient.ensureQueryData(issuesQuery),
    ]),
  component: CoursePage,
});

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "assignments", label: "Assignments" },
  { id: "grading", label: "Grading" },
  { id: "schedule", label: "Schedule" },
  { id: "policies", label: "Policies" },
  { id: "resources", label: "Resources" },
] as const;

function CoursePage() {
  const { id } = Route.useParams();
  const { data: courses } = useSuspenseQuery(coursesQuery);
  const { data: allItems } = useSuspenseQuery(itemsQuery);
  const { data: allIssues } = useSuspenseQuery(issuesQuery);
  const qc = useQueryClient();
  const nav = useNavigate();
  const extract = useServerFn(extractSyllabus);
  const { open } = useSource();
  const [retrying, setRetrying] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const containerRef = useRef<HTMLDivElement>(null);
  const course = courses.find((c) => c.id === id);

  // Track which section is in view for the mini nav.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`section-${s.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveSection(e.target.id.replace("section-", ""));
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [course?.status]);

  if (!course) return <p className="text-muted-foreground">Course not found.</p>;
  const items = allItems.filter((i) => i.course_id === id);
  const issues = allIssues.filter((i) => i.course_id === id && i.status === "open");

  const patch = async (p: Partial<Course>) => {
    const { error } = await supabase.from("courses").update(p).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["courses"] });
  };

  const retry = async () => {
    if (!confirm("Re-run extraction? This replaces extracted items, including your manual edits.")) return;
    setRetrying(true);
    qc.setQueryData(["courses"], (cs: Course[]) => cs.map((c) => (c.id === id ? { ...c, status: "processing" } : c)));
    const r = await extract({ data: { courseId: id } });
    setRetrying(false);
    qc.invalidateQueries();
    r.ok ? toast.success("Syllabus re-extracted") : toast.error(r.error);
  };

  const remove = async () => {
    if (!confirm(`Delete ${course.name}? This removes the course and its PDF.`)) return;
    if (course.syllabus_path) await supabase.storage.from("syllabi").remove([course.syllabus_path]);
    await supabase.from("courses").delete().eq("id", id);
    qc.invalidateQueries();
    nav({ to: "/dashboard" });
  };

  const jump = (sid: string) => {
    document.getElementById(`section-${sid}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fade-up" ref={containerRef}>
      {/* Course header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft">
        <div className={cn("absolute inset-y-0 left-0 w-1.5", colorBg[course.color])} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {course.code && <span className={cn("rounded px-2 py-0.5 font-mono text-xs font-medium", colorSoft[course.color])}>{course.code}</span>}
              {course.term && <span className="text-xs text-muted-foreground">{course.term}</span>}
            </div>
            <EditableTitle value={course.name} onSave={(name) => patch({ name })} />
            <button
              onClick={() => open(course, 1)}
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent"
            >
              <FileText className="h-3.5 w-3.5" /> {course.file_name}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Course color">
                  <span className={cn("h-4 w-4 rounded-full", colorBg[course.color])} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="grid grid-cols-4 gap-1 p-2">
                {COURSE_COLORS.map((c) => (
                  <DropdownMenuItem key={c} className="justify-center p-1.5" onClick={() => patch({ color: c })}>
                    <span className={cn("h-5 w-5 rounded-full", colorBg[c])} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={retry} disabled={retrying || course.status === "processing"}>
              <RefreshCw className={cn("h-3.5 w-3.5", (retrying || course.status === "processing") && "animate-spin")} /> Re-extract
            </Button>
            <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete course">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {issues.length > 0 && (
          <a href="/issues" className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            {issues.length} issue{issues.length > 1 && "s"} flagged in this syllabus — review before relying on these details.
          </a>
        )}
      </div>

      {course.status === "processing" ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border bg-card p-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Reading the syllabus. This usually takes under a minute.</p>
        </div>
      ) : course.status === "failed" ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-medium text-destructive">Extraction failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{course.error}</p>
          <p className="mt-1 text-xs text-muted-foreground">No information was guessed or saved.</p>
          <Button className="mt-4" onClick={retry}>Try again</Button>
        </div>
      ) : (
        <div className="mt-6 flex gap-8">
          {/* Sticky section nav — a quiet index, not tabs */}
          <nav className="sticky top-20 hidden h-fit w-36 shrink-0 space-y-0.5 lg:block">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => jump(s.id)}
                className={cn(
                  "block w-full rounded-md border-l-2 px-3 py-1.5 text-left text-sm transition-colors",
                  activeSection === s.id
                    ? "border-accent font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* One continuous document */}
          <div className="min-w-0 flex-1 space-y-12">
            <Section id="overview" title="Overview">
              <Overview course={course} patch={patch} />
            </Section>
            <Section id="assignments" title="Assignments & deadlines">
              <Assignments course={course} items={items} />
            </Section>
            <Section id="grading" title="Grading">
              <Grading course={course} />
            </Section>
            <Section id="schedule" title="Weekly schedule">
              <Schedule course={course} />
            </Section>
            <Section id="policies" title="Policies">
              <Policies course={course} />
            </Section>
            <Section id="resources" title="Books & materials">
              <Resources course={course} />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`section-${id}`} className="scroll-mt-20">
      <h2 className="border-b pb-2 font-display text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function EditableTitle({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(value);
  if (edit)
    return (
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); onSave(v); setEdit(false); }}>
        <Input value={v} onChange={(e) => setV(e.target.value)} autoFocus className="text-lg" />
        <Button size="icon" type="submit"><Check className="h-4 w-4" /></Button>
      </form>
    );
  return (
    <h1 className="group mt-2 flex items-center gap-2 font-display text-3xl md:text-4xl">
      {value}
      <button onClick={() => { setV(value); setEdit(true); }} className="opacity-0 transition-opacity group-hover:opacity-100">
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </button>
    </h1>
  );
}

const FACTS: { key: string; label: string; icon: any }[] = [
  { key: "professor", label: "Professor", icon: User },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "office", label: "Office", icon: Building2 },
  { key: "office_hours", label: "Office hours", icon: Clock },
  { key: "meeting_times", label: "Class times", icon: Clock },
  { key: "location", label: "Location", icon: MapPin },
  { key: "tas", label: "TAs", icon: Users },
];

function Overview({ course, patch }: { course: Course; patch: (p: Partial<Course>) => Promise<unknown> }) {
  const ov = (course.overview ?? {}) as Record<string, Fact & { edited?: boolean }>;
  const save = (key: string, value: string) =>
    patch({ overview: { ...ov, [key]: { value: value || null, page: ov[key]?.page ?? null, edited: true } } as any });
  return (
    <div className="mt-4 space-y-4">
      {ov["description"]?.value && (
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">About this course</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed"><SourceLink course={course} page={ov["description"].page}>{ov["description"].value}</SourceLink></p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {FACTS.map((f) => (
          <FactRow key={f.key} label={f.label} icon={f.icon} fact={ov[f.key]} course={course} onSave={(v) => save(f.key, v)} />
        ))}
      </div>
    </div>
  );
}

function FactRow({ label, icon: Icon, fact, course, onSave }: { label: string; icon: any; fact?: (Fact & { edited?: boolean }) | undefined; course: Course; onSave: (v: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(fact?.value ?? "");
  return (
    <div className="group rounded-xl border bg-card p-4 shadow-soft transition-colors hover:border-foreground/15">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
        {fact?.edited && <Badge variant="secondary" className="h-4 px-1 text-[9px]">edited</Badge>}
        <span className="ml-auto flex items-center gap-1">
          {!edit && (
            <button onClick={() => { setV(fact?.value ?? ""); setEdit(true); }} className="opacity-0 group-hover:opacity-100" aria-label={`Edit ${label}`}>
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </span>
      </div>
      {edit ? (
        <form className="mt-2 flex gap-1" onSubmit={(e) => { e.preventDefault(); onSave(v); setEdit(false); }}>
          <Input value={v} onChange={(e) => setV(e.target.value)} autoFocus className="h-8" />
          <Button size="icon" className="h-8 w-8" type="submit"><Check className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" type="button" onClick={() => setEdit(false)}><X className="h-3.5 w-3.5" /></Button>
        </form>
      ) : (
        <p className={cn("mt-1.5 text-sm", !fact?.value && "italic text-muted-foreground")}>{fact?.value ? <SourceLink course={course} page={fact.page}>{fact.value}</SourceLink> : "Not found in syllabus"}</p>
      )}
    </div>
  );
}

const KINDS = ["assignment", "exam", "quiz", "project", "reading", "other"];

function Assignments({ course, items }: { course: Course; items: Item[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [filter, setFilter] = useState("all");
  const shown = items.filter((i) => filter === "all" || i.kind === filter);

  const save = async () => {
    if (!editing?.title) { toast.error("Title is required"); return; }
    const row = {
      title: editing.title, kind: editing.kind ?? "assignment", due_date: editing.due_date || null,
      weight: editing.weight === undefined || editing.weight === null || (editing.weight as any) === "" ? null : Number(editing.weight),
      description: editing.description ?? null, due_text: editing.due_text ?? null, edited: true,
    };
    const { error } = editing.id
      ? await supabase.from("course_items").update(row).eq("id", editing.id)
      : await supabase.from("course_items").insert({ ...row, course_id: course.id });
    if (error) { toast.error(error.message); return; }
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["items"] });
    toast.success("Saved");
  };
  const del = async (id: string) => {
    await supabase.from("course_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["items"] });
  };

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {["all", ...KINDS].map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full border px-3 py-1 text-xs capitalize transition-colors", filter === k ? "border-foreground bg-foreground text-background" : "hover:bg-muted")}>
            {k}
          </button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto gap-1.5" onClick={() => setEditing({ kind: "assignment" })}>
          <Plus className="h-3.5 w-3.5" /> Add item
        </Button>
      </div>
      <div className="divide-y rounded-xl border bg-card shadow-soft">
        {shown.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No items.</p>}
        {shown.map((i) => (
          <div key={i.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
            <Badge variant="outline" className="w-20 justify-center capitalize">{i.kind}</Badge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium"><SourceLink course={course} page={i.source_page}>{i.title}</SourceLink> {i.edited && <span className="text-[10px] font-normal text-muted-foreground">· edited</span>}</p>
              <p className="truncate text-xs text-muted-foreground">
                {i.due_date ? fmtDate(i.due_date) : <span className="text-warning">{i.due_text ? `"${i.due_text}" (no exact date)` : "No date given"}</span>}
                {i.weight != null && ` · ${i.weight}%`}
                {i.description && ` · ${i.description}`}
              </p>
            </div>
            <button onClick={() => setEditing(i)} className="opacity-0 group-hover:opacity-100" aria-label="Edit"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={() => del(i.id)} className="opacity-0 group-hover:opacity-100" aria-label="Delete"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Correct item" : "Add item"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Title" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Select value={editing.kind ?? "assignment"} onValueChange={(v) => setEditing({ ...editing, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={editing.due_date ?? ""} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} />
                <Input type="number" placeholder="Weight %" value={editing.weight ?? ""} onChange={(e) => setEditing({ ...editing, weight: e.target.value as any })} />
              </div>
              <Textarea placeholder="Notes" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              {editing.due_text && <p className="text-xs text-muted-foreground">Syllabus wording: "{editing.due_text}"</p>}
            </div>
          )}
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Grading({ course }: { course: Course }) {
  const g = (course.grading ?? {}) as any;
  const weights: { component: string; weight: number | null; page: number | null }[] = g.weights ?? [];
  const scale: { grade: string; range: string; page: number | null }[] = g.scale ?? [];
  const notes: { text: string; page: number | null }[] = g.notes ?? [];
  const total = weights.reduce((s, w) => s + (w.weight ?? 0), 0);
  const [scores, setScores] = useState<Record<number, string>>({});
  const entered = weights.map((w, k) => ({ w: w.weight ?? 0, s: scores[k] })).filter((x) => x.s !== undefined && x.s !== "");
  const ew = entered.reduce((s, x) => s + x.w, 0);
  const current = ew ? entered.reduce((s, x) => s + x.w * Number(x.s), 0) / ew : null;

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Grade weights</h3>
          <span className={cn("rounded-full px-2 py-0.5 font-mono text-xs", Math.abs(total - 100) < 0.5 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
            Σ {total}%
          </span>
        </div>
        {weights.length === 0 && <p className="mt-3 text-sm italic text-muted-foreground">No grade breakdown found.</p>}
        <div className="mt-4 space-y-3">
          {weights.map((w, k) => (
            <div key={k}>
              <div className="flex items-center gap-2 text-sm">
                <SourceLink course={course} page={w.page} className="flex-1">{w.component}</SourceLink>
                <span className="font-mono text-xs">{w.weight ?? "?"}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", colorBg[course.color])} style={{ width: `${Math.min(100, w.weight ?? 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
        {weights.length > 0 && Math.abs(total - 100) >= 0.5 && (
          <p className="mt-4 text-xs text-warning">Weights don't sum to 100% — check the original syllabus.</p>
        )}
      </div>
      <div className="space-y-4">
        {weights.length > 0 && (
          <div className="rounded-xl border bg-card p-5 shadow-soft">
            <h3 className="flex items-center gap-2 font-medium"><Calculator className="h-4 w-4" /> Grade calculator</h3>
            <div className="mt-3 space-y-2">
              {weights.map((w, k) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{w.component}</span>
                  <Input type="number" placeholder="score %" className="h-8 w-24" value={scores[k] ?? ""} onChange={(e) => setScores({ ...scores, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm">
              Current average: <span className="font-display text-2xl">{current === null ? "—" : `${current.toFixed(1)}%`}</span>
              {ew > 0 && <span className="text-xs text-muted-foreground"> over {ew}% of the grade</span>}
            </p>
          </div>
        )}
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <h3 className="font-medium">Grading scale</h3>
          {scale.length === 0 ? (
            <p className="mt-3 text-sm italic text-muted-foreground">No grading scale found.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {scale.map((s, k) => (
                <div key={k} className="rounded-lg bg-muted px-2 py-1.5 text-center">
                  <div className="font-display text-xl">{s.grade}</div>
                  <div className="text-[11px] text-muted-foreground">{s.range}</div>
                </div>
              ))}
            </div>
          )}
          {notes.map((n, k) => (
            <p key={k} className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <SourceLink course={course} page={n.page} className="flex-1">{n.text}</SourceLink>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Schedule({ course }: { course: Course }) {
  const s = (course.schedule ?? []) as { week: string; date: string | null; topic: string; readings: string | null; page: number | null }[];
  if (!s.length) return <Empty text="No weekly schedule found in this syllabus." />;
  return (
    <div className="relative mt-4 space-y-0 pl-6">
      <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />
      {s.map((w, k) => (
        <div key={k} className="relative pb-4">
          <span className={cn("absolute -left-[19px] top-4 h-2.5 w-2.5 rounded-full ring-4 ring-background", colorBg[course.color])} />
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{w.week}</span>
              {w.date && <span>· {w.date}</span>}
            </div>
            <p className="mt-1 text-sm font-medium"><SourceLink course={course} page={w.page}>{w.topic}</SourceLink></p>
            {w.readings && <p className="mt-1 text-xs text-muted-foreground">📖 {w.readings}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

const POLICY_LABEL: Record<string, string> = {
  attendance: "Attendance", late_work: "Late work", ai_usage: "AI usage", academic_integrity: "Academic integrity", accommodations: "Accommodations", other: "Other",
};

function Policies({ course }: { course: Course }) {
  const p = (course.policies ?? []) as { category: string; title: string; text: string; page: number | null }[];
  const cats = ["attendance", "late_work", "ai_usage", "academic_integrity", "accommodations", "other"];
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {cats.map((c) => {
        const list = p.filter((x) => (cats.includes(x.category) ? x.category : "other") === c);
        if (!list.length && (c === "other" || c === "accommodations")) return null;
        return (
          <div key={c} className="rounded-xl border bg-card p-5 shadow-soft">
            <h3 className="text-sm font-medium">{POLICY_LABEL[c]}</h3>
            {list.length === 0 ? (
              <p className="mt-2 text-sm italic text-muted-foreground">Not specified in syllabus.</p>
            ) : (
              list.map((x, k) => (
                <div key={k} className="mt-3">
                  <div className="flex items-center gap-2">
                    <SourceLink course={course} page={x.page} className="flex-1 text-xs font-medium text-muted-foreground">{x.title}</SourceLink>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{x.text}</p>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

function Resources({ course }: { course: Course }) {
  const r = (course.resources ?? []) as { type: string; title: string; detail: string | null; required: boolean | null; page: number | null }[];
  if (!r.length) return <Empty text="No textbooks or materials found." />;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {r.map((x, k) => (
        <div key={k} className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{x.type}</Badge>
            {x.required === true && <Badge>Required</Badge>}
            {x.required === false && <Badge variant="secondary">Optional</Badge>}
          </div>
          <p className="mt-2 text-sm font-medium"><SourceLink course={course} page={x.page}>{x.title}</SourceLink></p>
          {x.detail && (/^https?:\/\//.test(x.detail) ? (
            <a href={x.detail} target="_blank" rel="noreferrer" className="break-all text-xs text-accent hover:underline">{x.detail}</a>
          ) : (
            <p className="text-xs text-muted-foreground">{x.detail}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="mt-4 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</p>;
}
