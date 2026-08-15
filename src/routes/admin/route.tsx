import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3, Boxes, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Package,
  Settings, ShoppingCart, Users, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Gomathi Tex" },
      { name: "description", content: "Restricted Gomathi Tex admin console for orders, products, customers and site content." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Console — Gomathi Tex" },
      { property: "og:description", content: "Restricted store management console." },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Boxes },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/content", label: "Banners & content", icon: ImageIcon },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (loading || isLoginRoute) return;
    if (!user) navigate({ to: "/admin/login", replace: true });
  }, [loading, user, isLoginRoute, navigate]);

  if (isLoginRoute) return <Outlet />;

  if (loading) {
    return <div className="px-4 py-24 text-center text-muted-foreground">Checking access…</div>;
  }

  if (!user) {
    return <div className="px-4 py-24 text-center text-muted-foreground">Redirecting to admin sign in…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Access denied</h1>
        <p className="mt-3 text-muted-foreground">
          Your account does not have administrator permissions. All admin data is also blocked
          at the database level, so nothing here is accessible.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/">Back to store</Link></Button>
          <Button
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login", replace: true });
            }}
          >
            Sign in as admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6">
      <aside
        className={`${open ? "block" : "hidden"} fixed inset-x-0 top-0 z-40 h-full overflow-y-auto border-r border-border bg-background p-4 lg:static lg:block lg:h-auto lg:w-60 lg:shrink-0 lg:bg-transparent lg:p-0`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="font-display text-lg font-semibold">Admin</span>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="px-2 pb-2 text-xs uppercase tracking-widest text-muted-foreground">Console</p>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item ? item.exact : false }}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-border pt-3">
            <p className="truncate px-2 text-xs text-muted-foreground">{user.email}</p>
            <button
              className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              onClick={async () => {
                await signOut();
                navigate({ to: "/admin/login", replace: true });
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <Button variant="outline" size="icon" aria-label="Open admin menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-4 w-4" /> Admin console
          </span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
