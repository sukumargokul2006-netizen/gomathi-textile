import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { inr } from "@/lib/shop";
import {
  ORDER_STATUSES, PAYMENT_STATUSES, useAdminOrder, useOrderMutations,
} from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/orders/$orderId")({
  component: OrderDetail,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function OrderDetail() {
  const { orderId } = Route.useParams();
  const { isAdmin } = useAuth();
  const { data: order, isLoading } = useAdminOrder(orderId, isAdmin);
  const { updateOrder } = useOrderMutations();

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Loading order…</p>;
  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/admin/orders">Back to orders</Link></Button>
      </div>
    );
  }

  const items = order.order_items ?? [];
  const subtotal = Number(order.subtotal) || items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);

  return (
    <div>
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={order.status} onValueChange={(s) => updateOrder.mutate({ id: order.id, patch: { status: s } })}>
            <SelectTrigger className="w-40 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={order.payment_status}
            onValueChange={(s) => updateOrder.mutate({ id: order.id, patch: { payment_status: s } })}
          >
            <SelectTrigger className="w-40 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold">Products</h2>
          <ul className="mt-3 divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.product_name} className="h-14 w-14 rounded-md object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID {it.product_id?.slice(0, 8) ?? "—"} · {inr(Number(it.unit_price))} {"\u00D7"} {it.quantity}
                  </p>
                </div>
                <p className="font-semibold">{inr(Number(it.unit_price) * it.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-3">
            <Row label="Subtotal" value={inr(subtotal)} />
            <Row label="Shipping" value={inr(Number(order.shipping_cost))} />
            <Row label="Discount" value={`- ${inr(Number(order.discount))}`} />
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Grand total</span>
              <span>{inr(Number(order.total))}</span>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-border p-5">
            <h2 className="text-lg font-semibold">Customer</h2>
            <div className="mt-2">
              <Row label="Name" value={order.full_name} />
              <Row label="Email" value={order.email} />
              <Row label="Phone" value={order.phone} />
              <Row label="Customer ID" value={order.user_id.slice(0, 8)} />
            </div>
          </section>

          <section className="rounded-xl border border-border p-5">
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.address_line}<br />
              {order.city}, {order.state} {order.pincode}<br />
              {order.country}
            </p>
            <h2 className="mt-4 text-lg font-semibold">Billing address</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.billing_address_line ? (
                <>
                  {order.billing_address_line}<br />
                  {order.billing_city}, {order.billing_state} {order.billing_pincode}<br />
                  {order.billing_country}
                </>
              ) : (
                "Same as shipping address"
              )}
            </p>
          </section>

          <section className="rounded-xl border border-border p-5">
            <h2 className="text-lg font-semibold">Payment</h2>
            <div className="mt-2">
              <Row label="Method" value={order.payment_method.toUpperCase()} />
              <Row label="Status" value={order.payment_status} />
              <Row label="Reference" value={order.transaction_ref ?? "—"} />
            </div>
            <Badge variant="secondary" className="mt-3 capitalize">Order status: {order.status}</Badge>
          </section>
        </div>
      </div>
    </div>
  );
}
