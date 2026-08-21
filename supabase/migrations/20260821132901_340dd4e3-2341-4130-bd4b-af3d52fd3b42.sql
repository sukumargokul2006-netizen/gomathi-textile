ALTER TABLE public.orders
  ADD CONSTRAINT orders_full_name_valid CHECK (full_name ~ '^[A-Za-z][A-Za-z .]{2,59}$'),
  ADD CONSTRAINT orders_phone_valid CHECK (phone ~ '^[6-9][0-9]{9}$'),
  ADD CONSTRAINT orders_pincode_valid CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  ADD CONSTRAINT orders_email_valid CHECK (email ~* '^[^@\s<>]+@[^@\s<>]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT orders_address_valid CHECK (char_length(address_line) BETWEEN 8 AND 200 AND address_line !~ '[<>]'),
  ADD CONSTRAINT orders_city_valid CHECK (city ~ '^[A-Za-z][A-Za-z .()-]{1,59}$'),
  ADD CONSTRAINT orders_state_valid CHECK (state ~ '^[A-Za-z][A-Za-z .()-]{1,59}$'),
  ADD CONSTRAINT orders_amounts_valid CHECK (subtotal >= 0 AND shipping_cost >= 0 AND total >= 0);