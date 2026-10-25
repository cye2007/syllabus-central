import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, Search, AlertTriangle, Plus, LogOut, Menu, Loader2, FileText, ChevronDown, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { coursesQuery, issuesQuery, colorBg } from "@/lib/courses";
import { Logo } from "./Logo";
import { UploadDialog } from "./UploadDialog";
import { SourceProvider } from "./SourceViewer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";


function UtilityLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { data: issues = [] } = useQuery(issuesQuery);
  const open = issues.filter((i) => i.status === "open").length;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const links = [
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/search", label: "Search", icon: Search },
    { to: "/issues", label: "Issues", icon: AlertTriangle },
  ] as const;
  return (
    <>
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
                  "relative flex h-8 items-center gap-1.5 border border-border/80 bg-background px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:px-3",
                  active && "border-transparent bg-foreground text-background hover:bg-foreground hover:text-background"
                )}
              >
                <l.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{l.label}</span>
                {l.to === "/issues" && open > 0 && (
                  <span
                    className={cn(
                      "grid h-4 min-w-4 place-items-center px-1 text-[10px] font-semibold",
                      active ? "bg-background text-foreground" : "bg-warning text-warning-foreground"
                    )}
                  >
                    {open}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="lg:hidden">{l.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

function CoursesMenu() {
  const { data: courses = [] } = useQuery(coursesQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onCoursePage = pathname.startsWith("/courses/");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1.5", onCoursePage && "bg-muted")}>
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Courses</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">My courses</DropdownMenuLabel>
        {courses.length === 0 && (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">No syllabi yet</div>
        )}
        {courses.map((c) => (
          <DropdownMenuItem key={c.id} asChild>
            <Link to="/courses/$id" params={{ id: c.id }} className="flex items-center gap-2.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-sm", colorBg[c.color])} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{c.code || c.name}</span>
                {c.code && <span className="block truncate text-[11px] text-muted-foreground">{c.name}</span>}
              </span>
              {c.status === "processing" && <Loader2 className="ml-auto h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
              {c.status === "failed" && <span className="ml-auto shrink-0 text-[10px] text-destructive">failed</span>}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex items-center gap-2.5 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> All syllabi
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopBar({ onUpload }: { onUpload: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-8">
        <Link to="/dashboard" aria-label="SyllaView home" className="mr-1 shrink-0">
          <Logo />
        </Link>
        <CoursesMenu />
        <div className="ml-auto flex items-center gap-1">
          <UtilityLinks />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ onUpload, onNavigate }: { onUpload: () => void; onNavigate: () => void }) {
  const { data: courses = [] } = useQuery(coursesQuery);
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="mt-4 space-y-0.5 px-3">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
          <FileText className="h-4 w-4 opacity-70" /> All syllabi
        </Link>
        <Link to="/calendar" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
          <CalendarDays className="h-4 w-4 opacity-70" /> Calendar
        </Link>
        <Link to="/search" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
          <Search className="h-4 w-4 opacity-70" /> Search syllabi
        </Link>
        <Link to="/issues" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
          <AlertTriangle className="h-4 w-4 opacity-70" /> Issues
        </Link>
      </div>
      <div className="mt-5 px-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">My courses</div>
      <div className="mt-1 flex-1 space-y-0.5 overflow-auto px-3">
        {courses.length === 0 && <p className="px-2.5 py-1.5 text-xs text-muted-foreground">No syllabi yet</p>}
        {courses.map((c) => (
          <Link
            key={c.id}
            to="/courses/$id"
            params={{ id: c.id }}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
            activeProps={{ className: "bg-muted font-medium" }}
          >
            <span className={cn("h-2 w-2 shrink-0 rounded-sm", colorBg[c.color])} />
            <span className="min-w-0 flex-1 truncate">{c.code || c.name}</span>
            {c.status === "processing" && <Loader2 className="ml-auto h-3 w-3 shrink-0 animate-spin text-muted-foreground" />}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-1 border-t p-3">
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
      <TooltipProvider delayDuration={300}>
        <div className="flex min-h-screen flex-col bg-background">
          {/* Desktop / tablet top bar */}
          <div className="hidden md:block">
            <TopBar onUpload={() => setUpload(true)} />
          </div>
          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobile(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" aria-label="SyllaView home">
              <Logo />
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <UtilityLinks />
            </div>
          </header>
          <Sheet open={mobile} onOpenChange={setMobile}>
            <SheetContent side="left" className="w-72 p-0">
              <MobileNav onUpload={() => setUpload(true)} onNavigate={() => setMobile(false)} />
            </SheetContent>
          </Sheet>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </main>
        </div>
        <UploadDialog open={upload} onOpenChange={setUpload} />
      </TooltipProvider>
    </SourceProvider>
  );
}

export const openUpload = () => window.dispatchEvent(new Event("atlas:upload"));
