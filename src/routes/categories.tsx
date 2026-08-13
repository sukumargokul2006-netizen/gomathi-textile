import { createFileRoute, Link } from "@tanstack/react-router";
import { useCategories } from "@/lib/shop";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Collections & Categories — Gomathi Tex" },
      {
        name: "description",
        content:
          "Explore Gomathi Tex collections: silk sarees, cotton sarees, salwar sets, kurtis, dhotis and shirts, and kids wear.",
      },
      { property: "og:title", content: "Gomathi Tex Collections" },
      { property: "og:description", content: "Six curated collections of traditional Indian textiles." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: categories } = useCategories();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Our collections</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={{ category: c.slug, q: undefined }}
            className="group overflow-hidden rounded-lg border border-border"
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}
            </div>
            <div className="p-4">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
