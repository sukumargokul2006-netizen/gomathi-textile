import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useBanners, useBannerMutations, uploadProductImage, type Banner } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/content")({
  component: AdminContent,
});

type Draft = {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: string;
};

const empty: Draft = { title: "", subtitle: "", image_url: "", link_url: "", is_active: true, sort_order: "0" };

function AdminContent() {
  const { data: banners } = useBanners();
  const { save, remove } = useBannerMutations();
  const [draft, setDraft] = useState<Draft>(empty);
  const [uploading, setUploading] = useState(false);

  const edit = (b: Banner) =>
    setDraft({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle ?? "",
      image_url: b.image_url ?? "",
      link_url: b.link_url ?? "",
      is_active: b.is_active,
      sort_order: String(b.sort_order),
    });

  const submit = () => {
    if (!draft.title.trim()) {
      toast.error("Banner title is required");
      return;
    }
    save.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        image_url: draft.image_url || null,
        link_url: draft.link_url.trim() || null,
        is_active: draft.is_active,
        sort_order: Number(draft.sort_order || 0),
      },
      { onSuccess: () => setDraft(empty) },
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Banners & offers</h1>
      <p className="mt-1 text-sm text-muted-foreground">Promotional banners shown on the storefront.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold">{draft.id ? "Edit banner" : "New banner"}</h2>
          <div>
            <Label htmlFor="b-title">Title</Label>
            <Input id="b-title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="b-sub">Subtitle / offer text</Label>
            <Input id="b-sub" value={draft.subtitle} onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="b-link">Link (e.g. /shop)</Label>
            <Input id="b-link" value={draft.link_url} onChange={(e) => setDraft((d) => ({ ...d, link_url: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="b-sort">Sort order</Label>
            <Input id="b-sort" type="number" value={draft.sort_order} onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="b-img">Banner image</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {draft.image_url ? <img src={draft.image_url} alt="Banner" className="h-16 w-28 rounded-md object-cover" /> : null}
              <Input
                id="b-img"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="max-w-xs"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploading(true);
                  try {
                    const url = await uploadProductImage(file);
                    setDraft((d) => ({ ...d, image_url: url }));
                    toast.success("Image uploaded");
                  } catch (err) {
                    toast.error((err as Error).message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="b-active" checked={draft.is_active} onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))} />
            <Label htmlFor="b-active">Active</Label>
          </div>
          <div className="flex gap-3">
            <Button onClick={submit} disabled={save.isPending}>{draft.id ? "Save banner" : "Create banner"}</Button>
            {draft.id ? <Button variant="outline" onClick={() => setDraft(empty)}>Cancel</Button> : null}
          </div>
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {(banners ?? []).map((b) => (
            <li key={b.id} className="flex items-center gap-3 p-4">
              {b.image_url ? <img src={b.image_url} alt={b.title} className="h-12 w-20 rounded-md object-cover" /> : <div className="h-12 w-20 rounded-md bg-muted" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{b.title}</p>
                <p className="truncate text-xs text-muted-foreground">{b.is_active ? "Active" : "Hidden"} · {b.subtitle ?? "—"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => edit(b)}>Edit</Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${b.title}`} onClick={() => { if (confirm("Delete this banner?")) remove.mutate(b.id); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
          {(banners ?? []).length === 0 ? <li className="p-4 text-sm text-muted-foreground">No banners yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
