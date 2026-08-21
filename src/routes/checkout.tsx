import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { effectivePrice, inr, useCart } from "@/lib/shop";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkoutSchema, lookupPincode, sanitize } from "@/lib/checkout-validation";
import { placeOrder as placeOrderFn } from "@/lib/orders.functions";

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

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  address_line: string;
  pincode: string;
  city: string;
  state: string;
};

const empty: FormState = {
  full_name: "",
  email: "",
  phone: "",
  address_line: "",
  pincode: "",
  city: "",
  state: "",
};

/** Keystroke-level filters so bad characters never enter the field at all. */
const masks: Partial<Record<keyof FormState, (v: string) => string>> = {
  full_name: (v) => v.replace(/[^A-Za-z .]/g, "").slice(0, 60),
  phone: (v) => v.replace(/\D/g, "").slice(0, 10),
  pincode: (v) => v.replace(/\D/g, "").slice(0, 6),
  city: (v) => v.replace(/[^A-Za-z .()-]/g, "").slice(0, 60),
  state: (v) => v.replace(/[^A-Za-z .()-]/g, "").slice(0, 60),
  email: (v) => v.replace(/\s/g, "").slice(0, 255),
  address_line: (v) => v.replace(/[<>]/g, "").slice(0, 200),
};

function fieldErrors(form: FormState) {
  const result = checkoutSchema.safeParse(form);
  if (result.success) return {} as Partial<Record<keyof FormState, string>>;
  const out: Partial<Record<keyof FormState, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormState;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

function Checkout() {
  const { user, loading } = useAuth();
  const { data: items } = useCart(user?.id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submitOrder = useServerFn(placeOrderFn);
  const [submitting, setSubmitting] = useState(false);
  const [pinStatus, setPinStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [form, setForm] = useState<FormState>(empty);
  const lastPin = useRef("");

  const errors = fieldErrors(form);
  const isValid = Object.keys(errors).length === 0;

  // Auto-fill city/state as soon as a full 6-digit PIN code is typed.
  useEffect(() => {
    if (form.pincode.length !== 6 || lastPin.current === form.pincode) return;
    lastPin.current = form.pincode;
    let cancelled = false;
    setPinStatus("loading");
    lookupPincode(form.pincode)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setPinStatus("notfound");
          return;
        }
        setPinStatus("found");
        setForm((f) => ({ ...f, city: res.city, state: res.state }));
      })
      .catch(() => !cancelled && setPinStatus("notfound"));
    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      full_name: true,
      email: true,
      phone: true,
      address_line: true,
      pincode: true,
      city: true,
      state: true,
    });
    if (!isValid) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    if (!items || items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    setSubmitting(true);
    try {
      const parsed = checkoutSchema.parse(form);
      await submitOrder({ data: { address: parsed } });
      qc.invalidateQueries({ queryKey: ["cart", user?.id] });
      toast.success("Order placed successfully!");
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    name: keyof FormState,
    label: string,
    opts: { type?: string; inputMode?: "text" | "tel" | "numeric" | "email"; hint?: string; autoComplete?: string } = {},
  ) => {
    const error = touched[name] ? errors[name] : undefined;
    return (
      <div>
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          type={opts.type ?? "text"}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          value={form[name]}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          onBlur={() => setTouched((t) => ({ ...t, [name]: true }))}
          onChange={(e) => {
            const mask = masks[name];
            const next = mask ? mask(e.target.value) : sanitize(e.target.value);
            setForm((f) => ({ ...f, [name]: next }));
          }}
          className={`mt-1.5 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {error ? (
          <p id={`${name}-error`} className="mt-1 text-xs text-destructive">{error}</p>
        ) : opts.hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{opts.hint}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Delivery details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("full_name", "Full name", { autoComplete: "name", hint: "Letters only" })}
            {field("phone", "Mobile number", {
              type: "tel",
              inputMode: "numeric",
              autoComplete: "tel",
              hint: "10 digits, starts with 6-9",
            })}
          </div>
          {field("email", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              {field("pincode", "PIN code", { inputMode: "numeric", autoComplete: "postal-code" })}
              {pinStatus === "loading" && (
                <p className="mt-1 text-xs text-muted-foreground">Looking up PIN code…</p>
              )}
              {pinStatus === "found" && (
                <p className="mt-1 text-xs text-primary">City and state filled automatically</p>
              )}
              {pinStatus === "notfound" && form.pincode.length === 6 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Could not find this PIN code — please type city and state.
                </p>
              )}
            </div>
            {field("city", "City", { autoComplete: "address-level2" })}
            {field("state", "State", { autoComplete: "address-level1" })}
          </div>
          {field("address_line", "Address", {
            autoComplete: "street-address",
            hint: "House / street / area",
          })}
          <p className="text-sm text-muted-foreground">
            Payment is collected on delivery. Our team calls to confirm every order.
          </p>
        </div>

        <aside className="h-fit rounded-lg border border-border p-4 sm:p-6">
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
          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={submitting || !isValid || !items || items.length === 0}
          >
            {submitting ? "Placing order..." : "Place order"}
          </Button>
          {!isValid && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Fill all required fields correctly to place your order.
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
