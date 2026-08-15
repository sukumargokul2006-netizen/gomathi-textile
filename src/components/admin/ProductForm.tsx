import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, type Product } from "@/lib/shop";
import { logAdminAction, uploadProductImage } from "@/lib/admin";
import { ProductGalleryManager } from "@/components/admin/ProductGalleryManager";

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

export function ProductForm({ productId }: { productId?: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["admin-product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId!).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Product | null;
    },
  });

  useEffect(() => {
    if (existing) setDraft(toDraft(existing));
  }, [existing]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      if (!d.name.trim()) throw new Error("Product name is required");
      if (Number(d.price) <= 0) throw new Error("Price must be greater than zero");
      const payload = {
        name: d.name.trim(),
        slug: d.slug.trim() || slugify(d.name),
        description: d.description.trim() || null,
        price: Number(d.price || 0),
        sale_price: d.sale_price ? Number(d.sale_price) : null,
        fabric: d.fabric.trim() || null,
        color: d.color.trim() || null,
        stock: Math.max(0, Number(d.stock || 0)),
        category_id: d.category_id || null,
        image_url: d.image_url || null,
        is_featured: d.is_featured,
        is_new: d.is_new,
      };
      if (d.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", d.id);
        if (error) throw error;
        await logAdminAction("update", "product", d.id, { name: payload.name });
        return { id: d.id, created: false };
      }
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) throw error;
      await logAdminAction("create", "product", data.id, { name: payload.name });
      return { id: data.id as string, created: true };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", res.id] });
      if (res.created) {
        toast.success("Product created — add gallery images below");
        navigate({ to: "/admin/products/edit/$productId", params: { productId: res.id } });
      } else {
        toast.success("Product saved");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      set("image_url", await uploadProductImage(file));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-border p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              setDraft((d) => ({ ...d, name, slug: d.id ? d.slug : slugify(name) }));
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-slug">URL slug</Label>
          <Input id="p-slug" value={draft.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea id="p-desc" rows={4} value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-price">Price ({"\u20B9"})</Label>
          <Input id="p-price" type="number" min="0" value={draft.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p-sale">Sale price ({"\u20B9"})</Label>
          <Input id="p-sale" type="number" min="0" value={draft.sale_price} onChange={(e) => set("sale_price", e.target.value)} />
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
          <Label htmlFor="p-stock">Stock quantity</Label>
          <Input id="p-stock" type="number" min="0" value={draft.stock} onChange={(e) => set("stock", e.target.value)} />
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
          <Label htmlFor="p-image">Main image</Label>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {draft.image_url ? (
              <img src={draft.image_url} alt="Product preview" className="h-20 w-20 rounded-md object-cover" />
            ) : null}
            <Input
              id="p-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="max-w-xs"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleUpload(file);
              }}
            />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Upload className="h-3 w-3" /> {uploading ? "Uploading…" : "JPG/PNG/WEBP up to 5 MB"}
            </span>
            {draft.image_url ? (
              <Button variant="ghost" size="sm" onClick={() => set("image_url", "")}>Remove image</Button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="p-featured" checked={draft.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
          <Label htmlFor="p-featured">Featured on homepage</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="p-new" checked={draft.is_new} onCheckedChange={(v) => set("is_new", v)} />
          <Label htmlFor="p-new">Mark as new arrival</Label>
        </div>

        <div className="sm:col-span-2 flex gap-3">
          <Button onClick={() => save.mutate(draft)} disabled={save.isPending}>
            {save.isPending ? "Saving…" : draft.id ? "Save changes" : "Create product"}
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/admin/products" })}>Back to list</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border p-5">
        <h2 className="mb-3 text-lg font-semibold">Image gallery</h2>
        <ProductGalleryManager productId={draft.id} />
      </div>
    </div>
  );
}
