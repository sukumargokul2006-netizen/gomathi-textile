import * as XLSX from "xlsx";
import type { Order } from "@/lib/admin";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

/**
 * Exports every order (one row per order item) to a single .xlsx workbook.
 * The Orders sheet carries full customer/address/payment info repeated per line
 * item; a compact Order Summary sheet has one row per order.
 */
export function exportOrdersToExcel(orders: Order[]) {
  const detailRows = orders.flatMap((o) => {
    const base = {
      "Order ID": `#${o.id.slice(0, 8).toUpperCase()}`,
      "Date": fmtDate(o.created_at),
      "Customer Name": o.full_name,
      "Email": o.email,
      "Phone": o.phone,
      "Address": o.address_line,
      "City": o.city,
      "State": o.state,
      "Pincode": o.pincode,
      "Country": o.country,
      "Payment Method": o.payment_method.toUpperCase(),
      "Payment Status": o.payment_status,
      "Order Status": o.status,
      "Transaction Ref": o.transaction_ref ?? "",
      "Notes": o.notes ?? "",
    };
    if (o.order_items.length === 0) {
      return [{
        ...base,
        "Product": "(no items)",
        "Unit Price (₹)": 0,
        "Qty": 0,
        "Line Total (₹)": 0,
        "Subtotal (₹)": Number(o.subtotal),
        "Shipping (₹)": Number(o.shipping_cost),
        "Discount (₹)": Number(o.discount),
        "Order Total (₹)": Number(o.total),
      }];
    }
    return o.order_items.map((item) => ({
      ...base,
      "Product": item.product_name,
      "Unit Price (₹)": Number(item.unit_price),
      "Qty": item.quantity,
      "Line Total (₹)": Number(item.unit_price) * item.quantity,
      "Subtotal (₹)": Number(o.subtotal),
      "Shipping (₹)": Number(o.shipping_cost),
      "Discount (₹)": Number(o.discount),
      "Order Total (₹)": Number(o.total),
    }));
  });

  const summaryRows = orders.map((o) => ({
    "Order ID": `#${o.id.slice(0, 8).toUpperCase()}`,
    "Date": fmtDate(o.created_at),
    "Customer": o.full_name,
    "Phone": o.phone,
    "City": o.city,
    "Items": o.order_items.reduce((s, i) => s + i.quantity, 0),
    "Total (₹)": Number(o.total),
    "Payment": o.payment_status,
    "Status": o.status,
  }));

  const wb = XLSX.utils.book_new();
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  wsDetail["!cols"] = Object.keys(detailRows[0] ?? { "No orders": "" }).map((k) => ({
    wch: Math.max(k.length + 2, 14),
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = Object.keys(summaryRows[0] ?? { "No orders": "" }).map((k) => ({
    wch: Math.max(k.length + 2, 12),
  }));
  XLSX.utils.book_append_sheet(wb, wsSummary, "Order Summary");
  XLSX.utils.book_append_sheet(wb, wsDetail, "Order Details");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `gomathi-tex-orders-${stamp}.xlsx`);
}
