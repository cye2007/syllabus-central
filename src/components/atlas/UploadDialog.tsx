import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UploadCloud, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { extractSyllabus } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

type Job = { name: string; stage: "uploading" | "extracting" | "done" | "failed"; error?: string };

export function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const extract = useServerFn(extractSyllabus);

  const update = (i: number, j: Partial<Job>) => setJobs((s) => s.map((x, k) => (k === i ? { ...x, ...j } : x)));

  async function handle(files: FileList | File[]) {
    const pdfs = [...files].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) return toast.error("Please choose PDF files.");
    const big = pdfs.find((f) => f.size > 20 * 1024 * 1024);
    if (big) return toast.error(`${big.name} is larger than 20 MB.`);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const offset = jobs.length;
    setJobs((s) => [...s, ...pdfs.map((f) => ({ name: f.name, stage: "uploading" as const }))]);

    await Promise.all(
      pdfs.map(async (f, n) => {
        const i = offset + n;
        try {
          const path = `${u.user!.id}/${crypto.randomUUID()}.pdf`;
          const { error: upErr } = await supabase.storage.from("syllabi").upload(path, f, { contentType: "application/pdf" });
          if (upErr) throw upErr;
          const { data: course, error } = await supabase
            .from("courses")
            .insert({ name: f.name.replace(/\.pdf$/i, ""), file_name: f.name, syllabus_path: path })
            .select()
            .single();
          if (error) throw error;
          update(i, { stage: "extracting" });
          qc.invalidateQueries({ queryKey: ["courses"] });
          const r = await extract({ data: { courseId: course.id } });
          if (!r.ok) throw new Error(r.error);
          update(i, { stage: "done" });
        } catch (e: any) {
          update(i, { stage: "failed", error: e.message });
        } finally {
          qc.invalidateQueries();
        }
      }),
    );
  }

  const pct = { uploading: 25, extracting: 65, done: 100, failed: 100 };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Add syllabi</DialogTitle>
          <DialogDescription>Drop one or more PDFs. AI extracts everything and links each fact to its page.</DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handle(e.dataTransfer.files);
          }}
          onClick={() => input.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all",
            drag ? "scale-[1.01] border-accent bg-accent/5" : "hover:border-foreground/30 hover:bg-muted/50",
          )}
        >
          <UploadCloud className={cn("h-8 w-8 transition-colors", drag ? "text-accent" : "text-muted-foreground")} />
          <p className="mt-3 text-sm font-medium">Drag & drop syllabus PDFs</p>
          <p className="text-xs text-muted-foreground">or click to browse · up to 20 MB each</p>
          <input
            ref={input}
            type="file"
            accept="application/pdf"
            multiple
            hidden
            onChange={(e) => e.target.files && handle(e.target.files)}
          />
        </div>
        {jobs.length > 0 && (
          <div className="max-h-64 space-y-2 overflow-auto">
            {jobs.map((j, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{j.name}</span>
                  {j.stage === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : j.stage === "failed" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  )}
                </div>
                <Progress value={pct[j.stage]} className="mt-2 h-1" />
                <p className={cn("mt-1 text-xs", j.stage === "failed" ? "text-destructive" : "text-muted-foreground")}>
                  {j.stage === "uploading" && "Uploading securely…"}
                  {j.stage === "extracting" && "Gemini is reading the syllabus… (30–60s)"}
                  {j.stage === "done" && "Course page ready"}
                  {j.stage === "failed" && (j.error || "Extraction failed — nothing was saved as fact.")}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
