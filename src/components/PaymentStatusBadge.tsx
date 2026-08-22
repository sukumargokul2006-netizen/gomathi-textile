const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-300",
  failed: "bg-red-100 text-red-900 border-red-300",
  refunded: "bg-blue-100 text-blue-900 border-blue-300",
};

const CUSTOMER_LABELS: Record<string, string> = {
  pending: "Payment Pending",
  paid: "Paid",
  failed: "Payment Failed",
  refunded: "Refund Completed",
};

const ADMIN_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export function PaymentStatusBadge({
  status,
  audience = "admin",
}: {
  status: string;
  audience?: "admin" | "customer";
}) {
  const key = (status ?? "pending").toLowerCase();
  const labels = audience === "customer" ? CUSTOMER_LABELS : ADMIN_LABELS;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STYLES[key] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {labels[key] ?? key}
    </span>
  );
}
