import { Link } from "@tanstack/react-router";
import { effectivePrice, inr, type Product } from "@/lib/shop";

export function ProductCard({ product }: { product: Product }) {
  const onSale = product.sale_price != null && Number(product.sale_price) < Number(product.price);
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex gap-2">
          {product.is_new ? (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              New
            </span>
          ) : null}
          {onSale ? (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-foreground">
              Sale
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.fabric}</p>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-primary">{inr(effectivePrice(product))}</span>
          {onSale ? (
            <span className="text-xs text-muted-foreground line-through">{inr(Number(product.price))}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}