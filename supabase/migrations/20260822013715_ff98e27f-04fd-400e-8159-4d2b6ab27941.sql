CREATE OR REPLACE FUNCTION public.decrement_product_stock(_product_id uuid, _qty integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining integer;
BEGIN
  IF _qty IS NULL OR _qty = 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF _qty < 0 THEN
    -- restock (rollback path)
    UPDATE public.products
       SET stock = stock + (-_qty)
     WHERE id = _product_id
    RETURNING stock INTO remaining;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found', _product_id;
    END IF;
    RETURN remaining;
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

REVOKE ALL ON FUNCTION public.decrement_product_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO service_role;