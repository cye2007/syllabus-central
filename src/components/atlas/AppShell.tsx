import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, Search, AlertTriangle, Plus, Moon, Sun, LogOut, Menu, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { coursesQuery, issuesQuery, colorBg, colorSoft } from "@/lib/courses";
import { Logo } from "./Logo";
import { UploadDialog } from "./UploadDialog";
import { SourceProvider } from "./SourceViewer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    localStorage.setItem("theme", d ? "dark" : "light");
  };
  return { dark, toggle };
}

function UtilityLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { data: issues = [] } = useQuery(issuesQuery);
  const open = issues.filter((i) => i.status === "open").length;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const links = [
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/search", label: "Search syllabi", icon: Search },
    { to: "/issues", label: open > 0 ? `Issues (${open})` : "Issues", icon: AlertTriangle },
  ] as const;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {links.map((l) => {
        const active = pathname.startsWith(l.to);
        return (
          <Tooltip key={l.to}>
            <TooltipTrigger asChild>
              <Link
                to={l.to}
                onClick={onNavigate}
                aria-label={l.label}
                className={cn(
                  "relative grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.to === "/issues" && open > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-warning px-1 text-[9px] font-semibold text-warning-foreground">
                    {open}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">{l.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function CourseList({ onNavigate }: { onNavigate?: () => void }) {
  const { data: courses = [] } = useQuery(coursesQuery);
  return (
    <div className="mt-1 flex-1 space-y-0.5 overflow-auto px-3">
      {courses.length === 0 && (
        <div className="mx-1 mt-2 rounded-lg border border-dashed p-4 text-center">
          <FileText className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">No syllabi yet. Add your first one above.</p>
        </div>
      )}
      {courses.map((c) => (
        <Link
          key={c.id}
          to="/courses/$id"
          params={{ id: c.id }}
          onClick={onNavigate}
          className="group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent font-medium text-sidebar-accent-foreground" }}
        >
          <span className={cn("h-2 w-2 shrink-0 rounded-sm", colorBg[c.color])} />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{c.code || c.name}</span>
            {c.code && <span className="block truncate text-[11px] text-muted-foreground">{c.name}</span>}
          </span>
          {c.status === "processing" && <Loader2 className="ml-auto h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
          {c.status === "failed" && <span className="ml-auto shrink-0 text-[10px] text-destructive">failed</span>}
        </Link>
      ))}
    </div>
  );
}

function SidebarBody({ onUpload, onNavigate }: { onUpload: () => void; onNavigate?: () => void }) {
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 pb-2">
        <Logo />
        <UtilityLinks onNavigate={onNavigate} />
      </div>
      <div className="px-3 pt-2">
        <Button onClick={onUpload} className="w-full justify-start gap-2" size="sm">
          <Plus className="h-4 w-4" /> Add syllabus
        </Button>
      </div>
      <div className="mt-5 px-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">My courses</div>
      <CourseList onNavigate={onNavigate} />
      <div className="flex items-center gap-1 border-t p-3">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-2 text-muted-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell() {
  const [upload, setUpload] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const h = () => setUpload(true);
    window.addEventListener("atlas:upload", h);
    return () => window.removeEventListener("atlas:upload", h);
  }, []);
  return (
    <SourceProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar md:block">
          <SidebarBody onUpload={() => setUpload(true)} />
        </aside>
        <Sheet open={mobile} onOpenChange={setMobile}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SidebarBody
              onUpload={() => {
                setMobile(false);
                setUpload(true);
              }}
              onNavigate={() => setMobile(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobile(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Logo />
            <UtilityLinks className="ml-auto" />
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>
      <UploadDialog open={upload} onOpenChange={setUpload} />
    </SourceProvider>
  );
}

export const openUpload = () => window.dispatchEvent(new Event("atlas:upload"));
