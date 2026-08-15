import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, type Category } from "@/lib/shop";
import { logAdminAction, uploadProductImage } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: string;
};

const empty: Draft = { name: "", slug: "", description: "", image_url: "", sort_order: "0" };

function AdminCategories() {
  const qc = useQueryClient();
  const { data: categories } = useCategories();
  const [draft, setDraft] = useState<Draft>(empty);
  const [uploading, setUploading] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      if (!d.name.trim()) throw new Error("Category name is required");
      const payload = {
        name: d.name.trim(),
        slug: d.slug.trim() || slugify(d.name),
        description: d.description.trim() || null,
        image_url: d.image_url || null,
        sort_order: Number(d.sort_order || 0),
      };
      if (d.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", d.id);
        if (error) throw error;
        await logAdminAction("update", "category", d.id, { name: payload.name });
      } else {
        const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
        if (error) throw error;
        await logAdminAction("create", "category", data.id, { name: payload.name });
      }
    },
    onSuccess: () => {
      refresh();
      setDraft(empty);
      toast.success("Category saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "category", id);
    },
    onSuccess: () => {
      refresh();
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const edit = (c: Category) =>
    setDraft({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image_url: c.image_url ?? "",
      sort_order: String(c.sort_order),
    });

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Categories</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold">{draft.id ? "Edit category" : "New category"}</h2>
          <div>
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value, slug: d.id ? d.slug : slugify(e.target.value) }))
              }
            />
          </div>
          <div>
            <Label htmlFor="c-slug">Slug</Label>
            <Input id="c-slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" rows={3} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="c-sort">Sort order</Label>
            <Input id="c-sort" type="number" value={draft.sort_order} onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="c-img">Image</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {draft.image_url ? <img src={draft.image_url} alt="Category" className="h-16 w-16 rounded-md object-cover" /> : null}
              <Input
                id="c-img"
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
                    setDraft((d) => ({ ...d, image_url: "" }));
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
          <div className="flex gap-3">
            <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
              <Plus className="mr-2 h-4 w-4" /> {draft.id ? "Save category" : "Create category"}
            </Button>
            {draft.id ? <Button variant="outline" onClick={() => setDraft(empty)}>Cancel</Button> : null}
          </div>
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-4">
              {c.image_url ? <img src={c.image_url} alt={c.name} className="h-12 w-12 rounded-md object-cover" /> : <div className="h-12 w-12 rounded-md bg-muted" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => edit(c)}>Edit</Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${c.name}`}
                onClick={() => { if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
