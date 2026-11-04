import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Gomathi Tex" },
      { name: "description", content: "Sign in to your Gomathi Tex account to shop, save your bag and track orders." },
      { property: "og:title", content: "Sign In — Gomathi Tex" },
      { property: "og:description", content: "Sign in with your email and password or your Google account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/shop" });
  }, [user, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : error.message,
      );
      return;
    }
    navigate({ to: "/shop" });
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    // Tokens were returned and the session is already set.
    setBusy(false);
    const { data } = await supabase.auth.getSession();
    if (data.session) navigate({ to: "/shop" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-semibold">Welcome to Gomathi Tex</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Sign in to browse our collections, save your bag and track orders.
      </p>

      <form onSubmit={signIn} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="si-email">Email</Label>
          <Input
            id="si-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="si-pass">Password</Label>
          <Input
            id="si-pass"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          Sign in
        </Button>
        <p className="text-center text-sm">
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() =>
              supabase.auth
                .resetPasswordForEmail(email.trim(), {
                  redirectTo: `${window.location.origin}/reset-password`,
                })
                .then(({ error }) =>
                  error
                    ? toast.error(error.message)
                    : toast.success("Password reset link sent to your email."),
                )
            }
            disabled={!email}
          >
            Forgot password?
          </button>
        </p>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={google} disabled={busy}>
        Continue with Google
      </Button>
    </div>
  );
}
