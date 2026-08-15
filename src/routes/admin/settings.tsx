import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog, useSaveSettings, useSiteSettings } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

const FIELDS = [
  ["announcement", "Announcement bar text"],
  ["support_phone", "Support phone"],
  ["support_whatsapp", "WhatsApp number"],
  ["support_email", "Support email"],
  ["free_shipping_threshold", "Free shipping above (₹)"],
  ["shipping_flat_rate", "Flat shipping rate (₹)"],
] as const;

function AdminSettings() {
  const { isAdmin, user } = useAuth();
  const { data: settings } = useSiteSettings();
  const { data: audit } = useAuditLog(isAdmin);
  const save = useSaveSettings();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email}</p>

      <div className="mt-5 grid max-w-2xl gap-4 rounded-xl border border-border p-5">
        {FIELDS.map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={`s-${key}`}>{label}</Label>
            <Input
              id={`s-${key}`}
              value={form[key] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div>
          <Label htmlFor="s-address">Store address</Label>
          <Textarea
            id="s-address"
            rows={3}
            value={form["store_address"] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, store_address: e.target.value }))}
          />
        </div>
        <div>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      <section className="mt-8 max-w-3xl rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold">Admin activity log</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(audit ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="capitalize">{a.action} {a.entity} {a.entity_id ? `· ${a.entity_id.slice(0, 8)}` : ""}</span>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("en-IN")}</span>
            </li>
          ))}
          {(audit ?? []).length === 0 ? <li className="py-2 text-muted-foreground">Nothing logged yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
