import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
  Clock4,
  Columns3,
  FileSearch,
  FileUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/atlas/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SyllaView — every syllabus, one command center" },
      { name: "description", content: "Upload your syllabi. Get a semester overview with all classes side by side, course pages, a unified calendar, office hours, and searchable answers — every fact linked to its source page." },
      { property: "og:title", content: "SyllaView — every syllabus, one command center" },
      { property: "og:description", content: "Upload your syllabi. Get a semester overview, course pages, a unified calendar, and searchable answers — every fact linked to its source page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileUp, title: "AI extraction", body: "Drop in a syllabus PDF. Professors, office hours, deadlines, grading and policies are pulled out and organized for you." },
  { icon: Columns3, title: "Semester overview", body: "All your classes side by side — professor, times, location, grading, policies and next deadlines line up in one view." },
  { icon: Clock4, title: "Help today", body: "See who holds office hours right now, what's coming the rest of the week, and email a professor in one tap." },
  { icon: CalendarRange, title: "Unified calendar", body: "Every deadline across every course in one calendar. Overlapping due dates are flagged before they pile up — and exportable as .ics." },
  { icon: FileSearch, title: "Ask your syllabi", body: "Search across all your courses and get answers drawn from the syllabi themselves, not guesses." },
  { icon: ShieldCheck, title: "Source-verified", body: "Hover any detail to see which syllabus page it came from. Contradictions are flagged for you to review — never silently fixed." },
];

const steps = [
  { n: "01", title: "Upload a PDF", body: "Any course syllabus, straight from your computer." },
  { n: "02", title: "SyllaView reads it", body: "AI pulls out the facts and links each one to its page." },
  { n: "03", title: "Your semester, organized", body: "Overview, course pages, calendar and search — ready instantly." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center md:pt-28">
          <span className="inline-flex items-center gap-2 rounded-none border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft fade-up">
            <span className="h-1.5 w-1.5 rounded-none bg-accent" /> Powered by Google Gemini
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl fade-up" style={{ animationDelay: "60ms" }}>
            Every syllabus.
            <br />
            <span className="italic text-accent">One command center.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground fade-up" style={{ animationDelay: "120ms" }}>
            Drop in your PDFs and get a semester overview with all your classes side by side, course pages, a unified calendar, office hours and searchable answers.
          </p>
          <div className="mt-10 flex justify-center gap-3 fade-up" style={{ animationDelay: "180ms" }}>
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">Start your semester <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Everything in one place</h2>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, k) => (
          <div key={f.title} className="rounded-none border bg-card p-6 shadow-soft card-hover fade-up" style={{ animationDelay: `${200 + k * 60}ms` }}>
            <f.icon className="h-5 w-5 text-accent" />
            <h3 className="mt-4 font-medium">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl md:text-3xl">From PDF to organized semester in three steps</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="border bg-background p-6">
                <span className="font-display text-3xl text-accent">{s.n}</span>
                <h3 className="mt-3 font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-accent" />
        <h2 className="mt-4 font-display text-2xl md:text-3xl">Stop digging through PDFs.</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">Upload your syllabi once and find everything all semester.</p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">Start your semester <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
