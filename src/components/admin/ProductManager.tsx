import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { inr, useCategories, useProducts, type Product } from "@/lib/shop";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string;
  fabric: string;
  color: string;
  stock: string;
  category_id: string;
  image_url: string;
  is_featured: boolean;
  is_new: boolean;
};

const emptyDraft: Draft = {
  name: "", slug: "", description: "", price: "", sale_price: "", fabric: "",
  color: "", stock: "0", category_id: "", image_url: "", is_featured: false, is_new: true,
};

const toDraft = (p: Product): Draft => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description ?? "",
  price: String(p.price),
  sale_price: p.sale_price != null ? String(p.sale_price) : "",
  fabric: p.fabric ?? "",
  color: p.color ?? "",
  stock: String(p.stock),
  category_id: p.category_id ?? "",
  image_url: p.image_url ?? "",
  is_featured: p.is_featured,
  is_new: p.is_new,
});

export function ProductManager() {
  const qc = useQueryClient();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      if (!d.name.trim()) throw new Error("Product name is required");
      const payload = {
        name: d.name.trim(),
        slug: (d.slug.trim() || slugify(d.name)),
        description: d.description.trim() || null,
        price: Number(d.price || 0),
        sale_price: d.sale_price ? Number(d.sale_price) : null,
        fabric: d.fabric.trim() || null,
        color: d.color.trim() || null,
        stock: Number(d.stock || 0),
        category_id: d.category_id || null,
        image_url: d.image_url || null,
        is_featured: d.is_featured,
        is_new: d.is_new,
      };
      const { error } = d.id
        ? await supabase.from("products").update(payload).eq("id", d.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      setOpen(false);
      setDraft(emptyDraft);
      toast.success("Product saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (signErr) throw signErr;
      set("image_url", data.signedUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setDraft(toDraft(p));
    setOpen(true);
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Products</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit product" : "New product"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="p-name">Name</Label>
                <Input
                  id="p-name"
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      name,
                      slug: d.id ? d.slug : slugify(name),
                    }));
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="p-slug">URL slug</Label>
                <Input id="p-slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea id="p-desc" rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-price">Price ({"\u20B9"})</Label>
                <Input id="p-price" type="number" value={draft.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-sale">Sale price ({"\u20B9"})</Label>
                <Input id="p-sale" type="number" value={draft.sale_price} onChange={(e) => set("sale_price", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-fabric">Fabric</Label>
                <Input id="p-fabric" value={draft.fabric} onChange={(e) => set("fabric", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-color">Colour</Label>
                <Input id="p-color" value={draft.color} onChange={(e) => set("color", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-stock">Stock</Label>
                <Input id="p-stock" type="number" value={draft.stock} onChange={(e) => set("stock", e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={draft.category_id} onValueChange={(v) => set("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="p-image">Product image</Label>
                <div className="mt-2 flex items-center gap-4">
                  {draft.image_url ? (
                    <img src={draft.image_url} alt="Product preview" className="h-20 w-20 rounded-md object-cover" />
                  ) : null}
                  <div className="flex-1 space-y-2">
                    <Input
                      id="p-image"
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadImage(file);
                      }}
                    />
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Upload className="h-3 w-3" /> {uploading ? "Uploading…" : "JPG or PNG, square images look best"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch id="p-feat" checked={draft.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
                <Label htmlFor="p-feat">Featured</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="p-new" checked={draft.is_new} onCheckedChange={(v) => set("is_new", v)} />
                <Label htmlFor="p-new">Mark as new</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => save.mutate(draft)} disabled={save.isPending || uploading}>
                {save.isPending ? "Saving…" : "Save product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className="p-3 font-medium">Image</th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted" />
                  )}
                </td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{inr(Number(p.sale_price ?? p.price))}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${p.name}`}
                    onClick={() => {
                      if (confirm(`Delete ${p.name}?`)) remove.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}