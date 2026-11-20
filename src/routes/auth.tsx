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
      { name: "description", content: "Continue to Gomathi Tex shopping with your name, email address, and mobile number." },
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

  useEffect(() => {
    if (user) navigate({ to: "/shop" });
  }, [user, navigate]);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const details = customerDetailsSchema.safeParse({ fullName, email, mobile });
    if (!details.success) {
      toast.error(details.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setBusy(true);
    try {
      let activeUser = user;
      if (!activeUser) {
        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: {
              full_name: details.data.fullName,
              phone: details.data.mobile,
              contact_email: details.data.email,
            },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("Could not start your shopping session. Please try again.");
        activeUser = data.user;
      } else {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: details.data.fullName,
            phone: details.data.mobile,
            contact_email: details.data.email,
          },
        });
        if (error) throw error;
      }

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: activeUser.id,
          full_name: details.data.fullName,
          phone: details.data.mobile,
        },
        { onConflict: "id" },
      );
      if (profileError) throw profileError;

      navigate({ to: "/shop" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not continue. Please try again.");
    } finally {
      setBusy(false);
    }
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
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
