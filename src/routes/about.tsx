import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Gomathi Tex Handloom House" },
      { name: "description", content: "Gomathi Tex has woven silk and cotton textiles in Tamil Nadu since 1972, working directly with weaver families." },
      { property: "og:title", content: "Our Story — Gomathi Tex" },
      { property: "og:description", content: "Three generations of weaving heritage from Tamil Nadu." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold">Woven with care since 1972</h1>
      <div className="mt-8 space-y-5 text-muted-foreground">
        <p>
          Gomathi Tex began as a single handloom in a small Tamil Nadu town. Today we work with
          more than eighty weaver families across Kanchipuram, Chettinad and Coimbatore, bringing
          their craft directly to your wardrobe.
        </p>
        <p>
          Every saree is inspected by hand. We publish honest fabric details, keep our margins
          modest, and pay weavers before the piece leaves the loom.
        </p>
        <p>
          Whether you are dressing for a temple wedding or a Monday morning at work, we want the
          fabric to feel like it was made for you — because it was made by someone who cared.
        </p>
      </div>
      <dl className="mt-12 grid gap-8 sm:grid-cols-3">
        {[
          ["50+", "Years of weaving"],
          ["80+", "Partner weaver families"],
          ["25,000+", "Happy customers"],
        ].map(([n, l]) => (
          <div key={l}>
            <dt className="text-3xl font-semibold text-primary">{n}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{l}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
