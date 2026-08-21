import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkoutSchema } from "@/lib/checkout-validation";
import { z } from "zod";

const placeOrderInput = z.object({
  address: checkoutSchema,
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => placeOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const address = data.address;

    // Server-side source of truth: read the cart and price it here, never trust client totals.
    const { data: cart, error: cartError } = await supabase
      .from("cart_items")
      .select("id, quantity, product_id, products(id, name, price, sale_price, image_url, stock)")
      .eq("user_id", userId);
    if (cartError) throw new Error(cartError.message);
    if (!cart || cart.length === 0) throw new Error("Your bag is empty");

    type CartRow = (typeof cart)[number] & {
      products: {
        id: string;
        name: string;
        price: number;
        sale_price: number | null;
        image_url: string | null;
        stock: number;
      } | null;
    };

    const rows = cart as CartRow[];
    const lines = rows.map((row) => {
      if (!row.products) throw new Error("A product in your bag is no longer available");
      const quantity = Math.max(1, Math.min(20, Math.trunc(row.quantity)));
      const unit_price = Number(row.products.sale_price ?? row.products.price);
      return {
        product_id: row.product_id,
        product_name: row.products.name,
        image_url: row.products.image_url,
        unit_price,
        quantity,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
    const shipping_cost = subtotal > 1499 ? 0 : 79;
    const total = subtotal + shipping_cost;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        ...address,
        user_id: userId,
        country: "India",
        payment_method: "cod",
        payment_status: "pending",
        subtotal,
        shipping_cost,
        discount: 0,
        total,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw new Error(itemsError.message);

    await supabase.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id as string, total };
  });
