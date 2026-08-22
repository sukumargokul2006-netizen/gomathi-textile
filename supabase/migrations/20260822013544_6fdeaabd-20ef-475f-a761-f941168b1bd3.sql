CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _qty integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining integer;
BEGIN
  IF _qty IS NULL OR _qty < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  UPDATE public.products
     SET stock = stock - _qty
   WHERE id = _product_id
     AND stock >= _qty
  RETURNING stock INTO remaining;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', _product_id;
  END IF;

  RETURN remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_product_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO authenticated, service_role;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;