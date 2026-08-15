import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/products/add")({
  component: AddProduct,
});

function AddProduct() {
  return (
    <div>
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All products
      </Link>
      <h1 className="mt-3 mb-5 text-2xl font-semibold sm:text-3xl">Add product</h1>
      <ProductForm />
    </div>
  );
}
