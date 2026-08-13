import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { inr, useProducts } from "@/lib/shop";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store Admin Dashboard — Gomathi Tex" },
      { name: "description", content: "Internal Gomathi Tex dashboard for managing orders, stock and catalogue performance." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Store Admin — Gomathi Tex" },
      { property: "og:description", content: "Manage orders and inventory." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { data: products } = useProducts();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="px-4 py-24 text-center text-muted-foreground">Loading…</div>;

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Admin access only</h1>
        <p className="mt-2 text-muted-foreground">
          This dashboard is restricted to store administrators.
        </p>
        <Button asChild className="mt-6"><Link to="/">Back home</Link></Button>
      </div>
    );
  }

  const revenue = (orders ?? []).reduce((s, o) => s + Number(o.total), 0);
  const lowStock = (products ?? []).filter((p) => p.stock < 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Store dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Total orders", String(orders?.length ?? 0)],
          ["Revenue", inr(revenue)],
          ["Products", String(products?.length ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Orders</h2>
      <div className="mt-4 space-y-4">
        {(orders ?? []).map((o) => (
          <div key={o.id} className="rounded-lg border border-border p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{o.full_name} · #{o.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">
                  {o.phone} · {o.city}, {o.state} {o.pincode}
                </p>
              </div>
              <p className="font-semibold">{inr(Number(o.total))}</p>
              <Select
                value={o.status}
                onValueChange={(status) => updateStatus.mutate({ id: o.id, status })}
              >
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ul className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
              {o.order_items.map((it) => (
                <li key={it.id}>{it.product_name} {"\u00D7"} {it.quantity}</li>
              ))}
            </ul>
          </div>
        ))}
        {orders?.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : null}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Inventory</h2>
      {lowStock.length > 0 ? (
        <p className="mt-2 text-sm text-destructive">{lowStock.length} product(s) low on stock.</p>
      ) : null}
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">{p.name}</td>
                <td className="p-3">{inr(Number(p.price))}</td>
                <td className="p-3">
                  {p.stock < 5 ? (
                    <Badge variant="destructive">{p.stock}</Badge>
                  ) : (
                    <span>{p.stock}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
