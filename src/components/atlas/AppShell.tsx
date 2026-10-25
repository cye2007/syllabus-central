import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LayoutDashboard, CalendarDays, Search, AlertTriangle, Plus, Moon, Sun, LogOut, Menu, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { coursesQuery, issuesQuery, colorBg } from "@/lib/courses";
import { Logo } from "./Logo";
import { UploadDialog } from "./UploadDialog";
import { SourceProvider } from "./SourceViewer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/search", label: "Ask Atlas", icon: Search },
  { to: "/issues", label: "Review issues", icon: AlertTriangle },
] as const;

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

function SidebarBody({ onUpload, onNavigate }: { onUpload: () => void; onNavigate?: () => void }) {
  const { data: courses = [] } = useQuery(coursesQuery);
  const { data: issues = [] } = useQuery(issuesQuery);
  const open = issues.filter((i) => i.status === "open").length;
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const linkCls = "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent";
  const active = { className: "bg-sidebar-accent font-medium text-sidebar-accent-foreground" };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="px-3">
        <Button onClick={onUpload} className="w-full justify-start gap-2" size="sm">
          <Plus className="h-4 w-4" /> Add syllabus
        </Button>
      </div>
      <nav className="mt-4 space-y-0.5 px-3">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className={linkCls} activeProps={active} onClick={onNavigate}>
            <n.icon className="h-4 w-4 opacity-70" />
            {n.label}
            {n.to === "/issues" && open > 0 && (
              <span className="ml-auto rounded-full bg-warning px-1.5 text-[10px] font-semibold text-warning-foreground">{open}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-6 px-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Courses</div>
      <div className="mt-1 flex-1 space-y-0.5 overflow-auto px-3">
        {courses.length === 0 && <p className="px-2.5 py-1.5 text-xs text-muted-foreground">No courses yet</p>}
        {courses.map((c) => (
          <Link
            key={c.id}
            to="/courses/$id"
            params={{ id: c.id }}
            className={linkCls}
            activeProps={active}
            onClick={onNavigate}
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-sm", colorBg[c.color])} />
            <span className="truncate">{c.code || c.name}</span>
            {c.status === "processing" && <Loader2 className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />}
            {c.status === "failed" && <span className="ml-auto text-[10px] text-destructive">failed</span>}
          </Link>
        ))}
      </div>
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
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r bg-sidebar md:block">
          <SidebarBody onUpload={() => setUpload(true)} />
        </aside>
        <Sheet open={mobile} onOpenChange={setMobile}>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
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
