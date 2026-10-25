import { createContext, useContext, useState, type ReactNode } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { signedPdfUrl, type Course } from "@/lib/courses";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Ctx = { open: (course: Pick<Course, "syllabus_path" | "name">, page: number | null) => void };
const SourceCtx = createContext<Ctx>({ open: () => {} });

export function SourceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ url: string; page: number | null; name: string } | null>(null);
  const open: Ctx["open"] = async (course, page) => {
    if (!course.syllabus_path) return;
    try {
      const url = await signedPdfUrl(course.syllabus_path);
      setState({ url, page, name: course.name });
    } catch (e: any) {
      toast.error("Couldn't open the syllabus: " + e.message);
    }
  };
  const src = state ? `${state.url}#page=${state.page ?? 1}` : "";
  return (
    <SourceCtx.Provider value={{ open }}>
      {children}
      <Sheet open={!!state} onOpenChange={(o) => !o && setState(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-accent" />
              {state?.name}
              {state?.page && <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">p. {state.page}</span>}
              <a href={src} target="_blank" rel="noreferrer" className="ml-auto mr-6 text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </a>
            </SheetTitle>
          </SheetHeader>
          {state && <iframe key={src} src={src} title="Syllabus" className="h-full w-full flex-1 bg-muted" />}
        </SheetContent>
      </Sheet>
    </SourceCtx.Provider>
  );
}

export const useSource = () => useContext(SourceCtx);

export function SourceChip({ course, page }: { course: Pick<Course, "syllabus_path" | "name">; page: number | null | undefined }) {
  const { open } = useSource();
  if (!page) return <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">no page</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        open(course, page);
      }}
      title="Open source page"
      className="inline-flex items-center gap-1 rounded border border-transparent bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
    >
      <FileText className="h-3 w-3" />p.{page}
    </button>
  );
}

type SourceLinkProps = {
  course: Pick<Course, "syllabus_path" | "name">;
  page: number | null | undefined;
  children: ReactNode;
  className?: string;
};

/** Wraps a cited detail: dotted underline + "View in syllabus · page N" tooltip; click opens the page. */
export function SourceLink({ course, page, children, className }: SourceLinkProps) {
  const { open } = useSource();
  const [show, setShow] = useState(false);
  const [touch, setTouch] = useState(false);
  const go = () => page && open(course, page);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={show} onOpenChange={setShow}>
        <TooltipTrigger asChild>
          <span
            role={page ? "button" : undefined}
            tabIndex={0}
            onPointerDown={(e) => setTouch(e.pointerType === "touch")}
            onClick={(e) => {
              e.stopPropagation();
              if (touch && !show) return setShow(true);
              go();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                go();
              }
            }}
            className={cn(
              "rounded-sm decoration-dotted underline-offset-4 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              page ? "cursor-pointer hover:underline hover:decoration-accent focus-visible:underline" : "cursor-help",
              className,
            )}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {page ? (
            <button type="button" onClick={go} className="flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> View in syllabus · page {page}
            </button>
          ) : (
            "Page not found in syllabus"
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
