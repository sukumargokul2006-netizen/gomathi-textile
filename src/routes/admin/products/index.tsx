import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr, useCategories, useProducts } from "@/lib/shop";
import { logAdminAction } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("product_images").delete().eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "product", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = q.trim().toLowerCase();
  const rows = (products ?? []).filter(
    (p) =>
      (!term || `${p.name} ${p.slug} ${p.fabric ?? ""} ${p.color ?? ""}`.toLowerCase().includes(term)) &&
      (cat === "all" || p.category_id === cat),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">Products</h1>
        <Button asChild>
          <Link to="/admin/products/add"><Plus className="mr-2 h-4 w-4" /> Add product</Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-9" aria-label="Search products" />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-md object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.categories?.name ?? "Uncategorised"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {p.sale_price ? (
                    <span>
                      {inr(Number(p.sale_price))}{" "}
                      <s className="text-xs text-muted-foreground">{inr(Number(p.price))}</s>
                    </span>
                  ) : (
                    inr(Number(p.price))
                  )}
                </TableCell>
                <TableCell className={p.stock < 5 ? "text-destructive" : ""}>{p.stock}</TableCell>
                <TableCell className="space-x-1">
                  {p.is_featured ? <Badge variant="secondary">Featured</Badge> : null}
                  {p.is_new ? <Badge variant="secondary">New</Badge> : null}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button asChild variant="ghost" size="icon" aria-label={`Edit ${p.name}`}>
                    <Link to="/admin/products/edit/$productId" params={{ productId: p.id }}>
                      <Pencil className="h-4 w-4" />
                    </Link>
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
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No products found.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
