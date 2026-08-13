import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { effectivePrice, inr, useCartMutations, useProduct, useProducts } from "@/lib/shop";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${title} — Gomathi Tex` },
        {
          name: "description",
          content: `Buy ${title} online at Gomathi Tex. Authentic fabric, secure checkout and fast delivery across India.`,
        },
        { property: "og:title", content: `${title} — Gomathi Tex` },
        { property: "og:description", content: `Buy ${title} online at Gomathi Tex.` },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: all } = useProducts();
  const { user } = useAuth();
  const { add } = useCartMutations(user?.id);
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <Button asChild className="mt-6">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  const related = (all ?? [])
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    add.mutate({ productId: product.id, quantity: qty });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Home</Link> /{" "}
        <Link to="/shop" className="hover:text-primary">Shop</Link> /{" "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              width={900}
              height={1100}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">
            {product.categories?.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-primary">
              {inr(effectivePrice(product))}
            </span>
            {onSale ? (
              <span className="text-lg text-muted-foreground line-through">
                {inr(Number(product.price))}
              </span>
            ) : null}
          </div>
          <p className="mt-5 text-muted-foreground">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-5 text-sm">
            <div>
              <dt className="text-muted-foreground">Fabric</dt>
              <dd className="font-medium">{product.fabric ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Colour</dt>
              <dd className="font-medium">{product.color ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="font-medium">
                {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => q + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="lg" onClick={handleAdd} disabled={product.stock < 1 || add.isPending}>
              <ShoppingBag className="mr-2 h-4 w-4" /> Add to bag
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
