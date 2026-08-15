import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/lib/admin";
import { inr } from "@/lib/shop";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { isAdmin } = useAuth();
  const { data: customers } = useCustomers(isAdmin);
  const [q, setQ] = useState("");

  const term = q.trim().toLowerCase();
  const rows = (customers ?? []).filter(
    (c) => !term || `${c.full_name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(term),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Customer contact details are visible to administrators only.
      </p>

      <div className="relative mt-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" className="pl-9" aria-label="Search customers" />
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name ?? "—"}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell>{c.orderCount}</TableCell>
                <TableCell>{inr(c.spend)}</TableCell>
                <TableCell className="space-x-1">
                  {(c.roles.length ? c.roles : ["customer"]).map((r) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="capitalize">{r}</Badge>
                  ))}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No customers found.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
