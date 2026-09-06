import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileSpreadsheet, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { inr } from "@/lib/shop";
import { ORDER_STATUSES, PAYMENT_STATUSES, useAdminOrders, useOrderMutations } from "@/lib/admin";
import { exportOrdersToExcel } from "@/lib/export-orders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/orders/")({
  component: AdminOrders,
});

function AdminOrders() {
  const { isAdmin } = useAuth();
  const { data: orders } = useAdminOrders(isAdmin);
  const { updateOrder, deleteOrder } = useOrderMutations();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");

  const term = q.trim().toLowerCase();
  const rows = (orders ?? []).filter((o) => {
    const matchesTerm =
      !term ||
      [o.id, o.full_name, o.email, o.phone, o.city, o.pincode]
        .join(" ")
        .toLowerCase()
        .includes(term);
    const matchesStatus = status === "all" || o.status === status;
    const matchesPayment = payment === "all" || o.payment_status === payment;
    return matchesTerm && matchesStatus && matchesPayment;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">Orders</h1>
        <Button
          onClick={() => exportOrdersToExcel(orders ?? [])}
          disabled={!orders || orders.length === 0}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order id, name, email, phone, city…"
            className="pl-9"
            aria-label="Search orders"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  <Link to="/admin/orders/$orderId" params={{ orderId: o.id }} className="hover:text-primary">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <p className="text-xs text-muted-foreground">{o.order_items?.length ?? 0} item(s)</p>
                </TableCell>
                <TableCell>
                  <p>{o.full_name}</p>
                  <p className="text-xs text-muted-foreground">{o.phone}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="font-semibold">{inr(Number(o.total))}</TableCell>
                <TableCell>
                  <Badge variant={o.payment_status === "paid" ? "default" : "secondary"} className="capitalize">
                    {o.payment_status}
                  </Badge>
                  <p className="mt-1 text-xs uppercase text-muted-foreground">{o.payment_method}</p>
                </TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(s) => updateOrder.mutate({ id: o.id, patch: { status: s } })}>
                    <SelectTrigger className="w-36 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete order"
                    onClick={() => {
                      if (confirm("Delete this order permanently?")) deleteOrder.mutate(o.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No orders match your filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
