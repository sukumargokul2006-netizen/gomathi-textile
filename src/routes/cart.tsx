import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { effectivePrice, inr, useCart, useCartMutations } from "@/lib/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Shopping Bag — Gomathi Tex" },
      { name: "description", content: "Review the sarees and outfits in your Gomathi Tex bag before checkout." },
      { property: "og:title", content: "Your Shopping Bag — Gomathi Tex" },
      { property: "og:description", content: "Review your items and proceed to secure checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user, loading } = useAuth();
  const { data: items } = useCart(user?.id);
  const { setQuantity, remove } = useCartMutations(user?.id);

  const subtotal = (items ?? []).reduce(
    (sum, i) => sum + (i.products ? effectivePrice(i.products) * i.quantity : 0),
    0,
  );
  const shipping = subtotal > 1499 || subtotal === 0 ? 0 : 79;

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Sign in to see your bag</h1>
        <p className="mt-2 text-muted-foreground">Your bag is saved to your account.</p>
        <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Your bag</h1>
      {items && items.length > 0 ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.products?.image_url ? (
                    <img
                      src={item.products.image_url}
                      alt={item.products.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.products?.name}</p>
                  <p className="text-sm text-muted-foreground">{item.products?.fabric}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {item.products ? inr(effectivePrice(item.products)) : null}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity.mutate({ id: item.id, quantity: item.quantity + 1 })}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="font-semibold">
                  {item.products ? inr(effectivePrice(item.products) * item.quantity) : null}
                </p>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? "Free" : inr(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt><dd>{inr(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
          </aside>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Your bag is empty.</p>
          <Button asChild className="mt-6"><Link to="/shop">Start shopping</Link></Button>
        </div>
      )}
    </div>
  );
}
