import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Gomathi Tex" },
      { name: "description", content: "Restricted sign in for Gomathi Tex store administrators." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Sign In — Gomathi Tex" },
      { property: "og:description", content: "Store administrator sign in." },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) navigate({ to: "/admin", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Passwords are hashed and verified by the auth service; they are never stored by the app.
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    navigate({ to: "/admin", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border p-8">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Restricted area</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrator credentials required. Customer accounts cannot access this console.
        </p>

        {user && !isAdmin ? (
          <div className="mt-5 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">Access denied</p>
            <p className="mt-1 text-muted-foreground">
              You are signed in as {user.email}, which is not an admin account.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Shopping instead? <Link to="/auth" className="text-primary underline">Customer sign in</Link>
        </p>
      </div>
    </div>
  );
}
