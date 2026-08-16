import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Gomathi Tex" },
      { name: "description", content: "Securely choose a new password for your Gomathi Tex account." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Reset Password — Gomathi Tex" },
      { property: "og:description", content: "Secure Gomathi Tex account password reset." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecoveryLink = hash.get("type") === "recovery";
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (isRecoveryLink && session)) setRecoveryReady(true);
      setChecking(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (isRecoveryLink && data.session) setRecoveryReady(true);
      setChecking(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must contain at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. You can now sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  if (checking) {
    return <div className="px-4 py-24 text-center text-muted-foreground">Checking reset link…</div>;
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border border-border p-8">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        {!recoveryReady ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">This reset link is invalid or has expired. Request a new link from admin sign in.</p>
            <Button asChild className="w-full"><Link to="/admin/login">Back to admin sign in</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Updating password…" : "Update password"}</Button>
          </form>
        )}
      </div>
    </main>
  );
}