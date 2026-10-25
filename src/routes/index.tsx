import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, CalendarRange, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/atlas/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CourseAtlas — every syllabus, one command center" },
      { name: "description", content: "Upload your syllabi. AI builds course pages, a unified calendar, and flags conflicts — every fact linked to its source page." },
      { property: "og:title", content: "CourseAtlas — every syllabus, one command center" },
      { property: "og:description", content: "Upload your syllabi. AI builds course pages, a unified calendar, and flags conflicts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Sparkles, title: "AI extraction", body: "Professors, office hours, deadlines, grading, policies and readings — pulled from every PDF." },
  { icon: CalendarRange, title: "Unified calendar", body: "All courses in one view, with overlapping deadlines highlighted before they hurt." },
  { icon: FileSearch, title: "Ask anything", body: "\u201CWhich classes allow late work?\u201D Get side-by-side answers across every course." },
  { icon: ShieldCheck, title: "Source-verified", body: "Every fact links to its page. Contradictions are flagged, never silently fixed." },
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
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Powered by Google Gemini
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl fade-up" style={{ animationDelay: "60ms" }}>
            Every syllabus.
            <br />
            <span className="italic text-accent">One command center.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground fade-up" style={{ animationDelay: "120ms" }}>
            Drop in your PDFs. CourseAtlas organizes deadlines, grading and policies into a searchable semester dashboard.
          </p>
          <div className="mt-10 flex justify-center gap-3 fade-up" style={{ animationDelay: "180ms" }}>
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">Start your semester <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, k) => (
          <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft card-hover fade-up" style={{ animationDelay: `${200 + k * 60}ms` }}>
            <f.icon className="h-5 w-5 text-accent" />
            <h3 className="mt-4 font-medium">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
