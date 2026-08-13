import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useProducts } from "@/lib/shop";

type ShopSearch = { category?: string | undefined; q?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search['category'] === "string" ? search['category'] : undefined,
    q: typeof search['q'] === "string" ? search['q'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Sarees, Kurtis & Salwar Sets — Gomathi Tex" },
      {
        name: "description",
        content:
          "Browse the full Gomathi Tex catalogue: silk sarees, cotton handlooms, salwar sets, kurtis, dhotis and kids wear with transparent pricing.",
      },
      { property: "og:title", content: "Shop the Gomathi Tex catalogue" },
      { property: "og:description", content: "Silk, cotton, festive and everyday traditional wear." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category, q } = Route.useSearch();
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({ category, search: q });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">
        {categories?.find((c) => c.slug === category)?.name ?? "All products"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {q ? `Results for "${q}"` : "Handpicked traditional wear for every occasion."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/shop"
          search={{ category: undefined, q }}
          className={`rounded-full border px-4 py-1.5 text-sm ${!category ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
        >
          All
        </Link>
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={{ category: c.slug, q }}
            className={`rounded-full border px-4 py-1.5 text-sm ${category === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-muted-foreground">No products found.</p>
      )}
    </div>
  );
}
