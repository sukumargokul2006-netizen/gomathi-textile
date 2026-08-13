import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { inr } from "@/lib/shop";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account & Orders — Gomathi Tex" },
      { name: "description", content: "View your Gomathi Tex profile and track the status of every order you placed." },
      { property: "og:title", content: "My Account — Gomathi Tex" },
      { property: "og:description", content: "Profile details and order history." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, loading, isAdmin, signOut } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Sign in to view your account</h1>
        <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My account</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <Button asChild variant="outline"><Link to="/admin">Admin panel</Link></Button>
          ) : null}
          <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Order history</h2>
      {orders && orders.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                <p className="font-semibold">{inr(Number(o.total))}</p>
              </div>
              <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                {o.order_items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.product_name} {"\u00D7"} {it.quantity}</span>
                    <span>{inr(Number(it.unit_price) * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-muted-foreground">You haven't placed any orders yet.</p>
      )}
    </div>
  );
}
