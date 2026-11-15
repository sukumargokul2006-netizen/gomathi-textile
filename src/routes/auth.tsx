import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const customerDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(100, "Name is too long")
    .regex(/^[\p{L}][\p{L}\s'.-]*$/u, "Enter a valid name"),
  email: z.string().trim().email("Enter a valid email address").max(255, "Email is too long"),
  mobile: z.string().trim().regex(/^\d{10}$/, "Enter a 10-digit mobile number"),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Gomathi Tex" },
      { name: "description", content: "Sign in to Gomathi Tex with your name, email, mobile number, and email verification code." },
      { property: "og:title", content: "Sign In — Gomathi Tex" },
      { property: "og:description", content: "Sign in to Gomathi Tex and browse the collection." },
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [completingSignIn, setCompletingSignIn] = useState(false);

  useEffect(() => {
    if (user && !completingSignIn) navigate({ to: "/shop" });
  }, [user, completingSignIn, navigate]);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!verificationSent) {
      const details = customerDetailsSchema.safeParse({ fullName, email, mobile });
      if (!details.success) {
        toast.error(details.error.issues[0]?.message ?? "Check your details and try again.");
        return;
      }
      setFullName(details.data.fullName);
      setEmail(details.data.email);
      setMobile(details.data.mobile);
      setBusy(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: details.data.email,
        options: {
          shouldCreateUser: true,
          data: { full_name: details.data.fullName, phone: details.data.mobile },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message || "Could not send your verification code. Please try again.");
        return;
      }
      setVerificationSent(true);
      toast.success("A verification code has been sent to your email.");
      return;
    }

    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code sent to your email.");
      return;
    }
    setBusy(true);
    setCompletingSignIn(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.user) {
      setBusy(false);
      setCompletingSignIn(false);
      toast.error(error?.message || "That verification code is invalid or expired. Please try again.");
      return;
    }

    const verifiedDetails = customerDetailsSchema.safeParse({ fullName, email, mobile });
    if (!verifiedDetails.success) {
      setBusy(false);
      setCompletingSignIn(false);
      toast.error("Please check your name, email, and mobile number.");
      return;
    }
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: verifiedDetails.data.fullName,
        phone: verifiedDetails.data.mobile,
      },
      { onConflict: "id" },
    );
    setBusy(false);
    if (profileError) {
      setCompletingSignIn(false);
      toast.error("Your sign-in succeeded, but your details could not be saved. Please try again.");
      return;
    }
    navigate({ to: "/shop" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-semibold">Welcome to Gomathi Tex</h1>
      <form onSubmit={signIn} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="si-name">User Name</Label>
          <Input
            id="si-name"
            type="text"
            required
            autoComplete="name"
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5"
            disabled={verificationSent || busy}
          />
        </div>
        <div>
          <Label htmlFor="si-email">Email ID</Label>
          <Input
            id="si-email"
            type="email"
            required
            autoComplete="email"
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            disabled={verificationSent || busy}
          />
        </div>
        <div>
          <Label htmlFor="si-mobile">Mobile Number</Label>
          <Input
            id="si-mobile"
            type="tel"
            required
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="mt-1.5"
            disabled={verificationSent || busy}
          />
        </div>
        {verificationSent && (
          <div>
            <Label htmlFor="si-code">Email Verification Code</Label>
            <Input
              id="si-code"
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1.5"
              disabled={busy}
            />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : verificationSent ? "Verify & Sign In" : "Sign In"}
        </Button>
        {verificationSent && (
          <p className="text-center text-sm text-muted-foreground">
            Enter the code sent to your email. {" "}
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setVerificationSent(false);
                setOtp("");
              }}
              disabled={busy}
            >
              Change details
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
