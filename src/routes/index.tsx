import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gomathi Tex — Silk & Cotton Sarees, Salwar Sets, Kurtis Online" },
      {
        name: "description",
        content:
          "Shop handpicked Kanchipuram silk sarees, handloom cotton sarees, salwar sets, kurtis and traditional wear at Gomathi Tex. Free shipping across India above Rs.1499.",
      },
      { property: "og:title", content: "Gomathi Tex — Traditional Textiles Online" },
      {
        property: "og:description",
        content: "Silk sarees, cotton handlooms, salwar sets and kurtis, woven in Tamil Nadu.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const featured = (products ?? []).filter((p) => p.is_featured).slice(0, 8);
  const fresh = (products ?? []).filter((p) => p.is_new).slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden bg-secondary/40">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              New season collection
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Timeless weaves, <span className="text-gradient-emerald">everyday grace</span>
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground">
              Pure silks, breathable handlooms and festive sets — curated by three generations of
              weavers and delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop">
                  Shop new arrivals <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/categories">Explore collections</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src="/images/hero.jpg"
              alt="Woman wearing an emerald green silk saree with gold zari border"
              width={1600}
              height={1104}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-center text-2xl font-semibold">Shop by category</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to="/shop"
              search={{ category: c.slug, q: undefined }}
              className="group text-center"
            >
              <div className="aspect-square overflow-hidden rounded-full border border-border bg-muted">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : null}
              </div>
              <p className="mt-3 text-sm font-medium">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Featured picks</h2>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Award, title: "Premium quality", copy: "Finest fabrics and stitching" },
            { icon: Truck, title: "Fast delivery", copy: "Shipped across India" },
            { icon: RefreshCcw, title: "Easy returns", copy: "7-day hassle free returns" },
            { icon: ShieldCheck, title: "Secure payments", copy: "100% safe checkout" },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <f.icon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Just arrived</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {fresh.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
