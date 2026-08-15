import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, IndianRupee, Package, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { inr, useProducts } from "@/lib/shop";
import { useAdminOrders, useAuditLog, useCustomers } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Package }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { isAdmin } = useAuth();
  const { data: orders } = useAdminOrders(isAdmin);
  const { data: products } = useProducts();
  const { data: customers } = useCustomers(isAdmin);
  const { data: audit } = useAuditLog(isAdmin);

  const all = orders ?? [];
  const pending = all.filter((o) => ["pending", "confirmed", "processing"].includes(o.status));
  const completed = all.filter((o) => o.status === "delivered");
  const revenue = all.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const lowStock = (products ?? []).filter((p) => p.stock < 5);

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything happening across the store.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total orders" value={String(all.length)} icon={ShoppingCart} />
        <Stat label="Pending orders" value={String(pending.length)} icon={AlertTriangle} />
        <Stat label="Delivered orders" value={String(completed.length)} icon={ShoppingCart} />
        <Stat label="Revenue" value={inr(revenue)} icon={IndianRupee} />
        <Stat label="Customers" value={String(customers?.length ?? 0)} icon={Users} />
        <Stat label="Products" value={String(products?.length ?? 0)} icon={Package} />
        <Stat label="Low stock (<5)" value={String(lowStock.length)} icon={AlertTriangle} />
        <Stat label="Cancelled" value={String(all.filter((o) => o.status === "cancelled").length)} icon={AlertTriangle} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary underline">View all</Link>
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {all.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                <Link
                  to="/admin/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="min-w-0 flex-1 truncate hover:text-primary"
                >
                  #{o.id.slice(0, 8).toUpperCase()} · {o.full_name}
                </Link>
                <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                <span className="font-medium">{inr(Number(o.total))}</span>
              </li>
            ))}
            {all.length === 0 ? <li className="py-2 text-muted-foreground">No orders yet.</li> : null}
          </ul>
        </section>

        <section className="rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold">Low stock products</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {lowStock.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <Link to="/admin/products/edit/$productId" params={{ productId: p.id }} className="truncate hover:text-primary">
                  {p.name}
                </Link>
                <span className="text-destructive">{p.stock} left</span>
              </li>
            ))}
            {lowStock.length === 0 ? <li className="py-2 text-muted-foreground">Stock levels look healthy.</li> : null}
          </ul>
        </section>

        <section className="rounded-xl border border-border p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Recent admin activity</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(audit ?? []).slice(0, 8).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="capitalize">{a.action} {a.entity}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
            {(audit ?? []).length === 0 ? <li className="py-2 text-muted-foreground">No activity logged yet.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
