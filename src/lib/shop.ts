import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  fabric: string | null;
  color: string | null;
  stock: number;
  image_url: string | null;
  is_featured: boolean;
  is_new: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const effectivePrice = (p: Pick<Product, "price" | "sale_price">) =>
  Number(p.sale_price ?? p.price);

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useProducts(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["products", filters?.category ?? "all", filters?.search ?? ""],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name, slug)");
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);
      const { data, error } = await query.order("created_at");
      if (error) throw error;
      let rows = (data ?? []) as (Product & { categories: { name: string; slug: string } | null })[];
      if (filters?.category) rows = rows.filter((r) => r.categories?.slug === filters.category);
      return rows;
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as (Product & { categories: { name: string; slug: string } | null }) | null;
    },
  });
}

export type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  products: Product | null;
};

export function useCart(userId?: string) {
  return useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(*)")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as CartRow[];
    },
  });
}

export function useCartMutations(userId?: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart", userId] });

  const add = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!userId) throw new Error("Please sign in first");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: userId, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Added to bag");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity < 1) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Removed from bag");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { add, setQuantity, remove };
}