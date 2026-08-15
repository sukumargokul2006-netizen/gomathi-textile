import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const PAYMENT_METHODS = ["cod", "upi", "card", "netbanking", "other"] as const;

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
};

export type Order = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  billing_address_line: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_pincode: string | null;
  billing_country: string | null;
  payment_method: string;
  payment_status: string;
  transaction_ref: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
};

/** Records an admin action. RLS only accepts rows where admin_id = auth.uid() and the user is an admin. */
export async function logAdminAction(
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
) {
  const { data } = await supabase.auth.getUser();
  const adminId = data.user?.id;
  if (!adminId) return;
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    entity,
    entity_id: entityId ?? null,
    details: (details ?? null) as never,
  });
}

/* ------------------------------- orders -------------------------------- */

export function useAdminOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-orders"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });
}

export function useAdminOrder(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-order", orderId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Order | null;
    },
  });
}

export function useOrderMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-order"] });
  };

  const updateOrder = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { status?: string; payment_status?: string; transaction_ref?: string | null };
    }) => {
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
      await logAdminAction("update", "order", id, patch);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", id);
      if (itemsError) throw itemsError;
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "order", id);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Order deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { updateOrder, deleteOrder };
}

/* ------------------------------ customers ------------------------------ */

export type Customer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export function useCustomers(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-customers"],
    enabled,
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("orders").select("user_id, email, total"),
      ]);
      if (error) throw error;
      const roleMap = new Map<string, string[]>();
      for (const r of roles ?? []) {
        roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as string]);
      }
      return (profiles ?? []).map((p) => {
        const own = (orders ?? []).filter((o) => o.user_id === p.id);
        return {
          ...(p as Customer),
          roles: roleMap.get(p.id) ?? [],
          email: own[0]?.email ?? null,
          orderCount: own.length,
          spend: own.reduce((s, o) => s + Number(o.total), 0),
        };
      });
    },
  });
}

/* ------------------------------- banners ------------------------------- */

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });
}

export function useBannerMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["banners"] });

  const save = useMutation({
    mutationFn: async (b: Partial<Banner> & { title: string }) => {
      if (b.id) {
        const { error } = await supabase.from("banners").update(b).eq("id", b.id);
        if (error) throw error;
        await logAdminAction("update", "banner", b.id);
        return;
      }
      const { data, error } = await supabase.from("banners").insert(b).select("id").single();
      if (error) throw error;
      await logAdminAction("create", "banner", data.id);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Banner saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("delete", "banner", id);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Banner removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { save, remove };
}

/* ---------------------------- site settings ---------------------------- */

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""])) as Record<string, string>;
    },
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Record<string, string>) => {
      const rows = Object.entries(entries).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from("site_settings").upsert(rows);
      if (error) throw error;
      await logAdminAction("update", "site_settings", null, entries);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ----------------------------- audit trail ----------------------------- */

export function useAuditLog(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-audit"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* --------------------------- secure uploads ---------------------------- */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5;

/**
 * Validates and uploads a product image. Upload/delete on this bucket is
 * restricted to admins by storage RLS, so a customer calling this fails server-side.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXT.includes(ext)) {
    throw new Error("Only JPG, PNG, WEBP, AVIF or GIF images are allowed");
  }
  if (file.size > MAX_BYTES) throw new Error("Image must be smaller than 5 MB");
  if (file.size === 0) throw new Error("File is empty");

  const safeExt = ext === "jpeg" ? "jpg" : ext;
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${safeExt}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;

  const { data, error: signErr } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr) throw signErr;
  await logAdminAction("upload", "product_image", path);
  return data.signedUrl;
}
