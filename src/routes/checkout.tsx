import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { effectivePrice, inr, useCart } from "@/lib/shop";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Gomathi Tex" },
      { name: "description", content: "Enter your delivery details and place your Gomathi Tex order securely." },
      { property: "og:title", content: "Secure Checkout — Gomathi Tex" },
      { property: "og:description", content: "Place your order with cash on delivery or pay on confirmation." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { user, loading } = useAuth();
  const { data: items } = useCart(user?.id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  });

  const subtotal = (items ?? []).reduce(
    (sum, i) => sum + (i.products ? effectivePrice(i.products) * i.quantity : 0),
    0,
  );
  const shipping = subtotal > 1499 || subtotal === 0 ? 0 : 79;
  const total = subtotal + shipping;

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Sign in to checkout</h1>
        <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !items || items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ ...form, user_id: user.id, total })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.products?.name ?? "Item",
          image_url: i.products?.image_url ?? null,
          unit_price: i.products ? effectivePrice(i.products) : 0,
          quantity: i.quantity,
        })),
      );
      if (itemsError) throw itemsError;

      await supabase.from("cart_items").delete().eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["cart", user.id] });
      toast.success("Order placed successfully!");
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: keyof typeof form, label: string, type = "text") => (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        required
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="mt-1.5"
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("full_name", "Full name")}
            {field("phone", "Phone number", "tel")}
          </div>
          {field("email", "Email", "email")}
          {field("address_line", "Address")}
          <div className="grid gap-4 sm:grid-cols-3">
            {field("city", "City")}
            {field("state", "State")}
            {field("pincode", "PIN code")}
          </div>
          <p className="text-sm text-muted-foreground">
            Payment is collected on delivery. Our team calls to confirm every order.
          </p>
        </div>

        <aside className="h-fit rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(items ?? []).map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {i.products?.name} {"\u00D7"} {i.quantity}
                </span>
                <span>{i.products ? inr(effectivePrice(i.products) * i.quantity) : null}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Shipping</dt><dd>{shipping === 0 ? "Free" : inr(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt><dd>{inr(total)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
