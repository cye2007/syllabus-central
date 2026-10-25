import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/atlas/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SyllaView" },
      { name: "description", content: "Sign in to your SyllaView semester dashboard." },
      { property: "og:title", content: "Sign in — SyllaView" },
      { property: "og:description", content: "Sign in to your SyllaView semester dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) nav({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r bg-sidebar lg:block">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <p className="font-display text-5xl leading-tight">
              Every syllabus.
              <br />
              <span className="italic text-accent">One command center.</span>
            </p>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Upload your PDFs and get deadlines, grading, policies and sources organized in seconds.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Extracted facts always link back to the original page.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm fade-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {sent ? (
            <div>
              <h1 className="font-display text-3xl">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <b>{email}</b>. Click it to finish creating your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-4xl">{mode === "in" ? "Welcome back" : "Create your atlas"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "in" ? "Sign in to your semester." : "Start organizing your semester."}
              </p>
              <Button variant="outline" className="mt-6 w-full" onClick={google}>
                Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <button
                className="mt-4 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "No account? Sign up" : "Already have an account? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
