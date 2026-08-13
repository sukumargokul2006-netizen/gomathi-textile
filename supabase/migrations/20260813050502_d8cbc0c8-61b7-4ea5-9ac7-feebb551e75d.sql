-- roles
CREATE TYPE public.app_role AS ENUM ('admin','customer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- catalogue
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  fabric text,
  color text,
  stock int NOT NULL DEFAULT 0,
  image_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders select" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin orders update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  image_url text,
  unit_price numeric(10,2) NOT NULL,
  quantity int NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items select" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- seed
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
 ('Silk Sarees','silk-sarees','Pure Kanchipuram and soft silk sarees','/images/cat-silk.jpg',1),
 ('Cotton Sarees','cotton-sarees','Everyday handloom cotton comfort','/images/cat-cotton.jpg',2),
 ('Salwar Sets','salwar-sets','Ready-to-wear and unstitched sets','/images/cat-salwar.jpg',3),
 ('Kurtis','kurtis','Daily wear and festive kurtis','/images/cat-kurti.jpg',4),
 ('Dhotis & Shirts','dhotis-shirts','Traditional menswear','/images/cat-men.jpg',5),
 ('Kids Wear','kids-wear','Festive picks for little ones','/images/cat-kids.jpg',6);

INSERT INTO public.products (category_id, name, slug, description, price, sale_price, fabric, color, stock, image_url, is_featured, is_new)
SELECT c.id, v.name, v.slug, v.description, v.price, v.sale_price, v.fabric, v.color, v.stock, v.image_url, v.is_featured, v.is_new
FROM (VALUES
 ('silk-sarees','Kanchipuram Pure Silk Saree','kanchipuram-pure-silk-saree','Handwoven pure silk with zari border and contrast pallu.',8999,7499,'Pure Silk','Emerald Green',12,'/images/product-1.jpg',true,true),
 ('silk-sarees','Soft Silk Temple Border Saree','soft-silk-temple-border-saree','Lightweight soft silk with traditional temple border.',4599,NULL,'Soft Silk','Maroon',18,'/images/product-2.jpg',true,true),
 ('silk-sarees','Bridal Zari Silk Saree','bridal-zari-silk-saree','Rich bridal saree with all-over zari butta work.',15999,13999,'Pure Silk','Deep Red',6,'/images/product-3.jpg',true,false),
 ('silk-sarees','Mysore Crepe Silk Saree','mysore-crepe-silk-saree','Featherlight crepe silk with a glossy finish.',3899,NULL,'Crepe Silk','Teal',20,'/images/product-4.jpg',false,true),
 ('cotton-sarees','Handloom Cotton Saree','handloom-cotton-saree','Breathable handloom cotton woven in Tamil Nadu.',1499,1199,'Cotton','Ivory',30,'/images/product-5.jpg',true,false),
 ('cotton-sarees','Chettinad Cotton Saree','chettinad-cotton-saree','Bold checks and contrast borders.',1899,NULL,'Cotton','Mustard',25,'/images/product-6.jpg',false,true),
 ('cotton-sarees','Kalamkari Print Cotton Saree','kalamkari-print-cotton-saree','Hand-block kalamkari prints on soft cotton.',2199,1899,'Cotton','Indigo',15,'/images/product-7.jpg',true,false),
 ('cotton-sarees','Linen Blend Daily Saree','linen-blend-daily-saree','Crisp linen blend for everyday elegance.',1699,NULL,'Linen','Sage Green',22,'/images/product-8.jpg',false,false),
 ('salwar-sets','Embroidered Anarkali Set','embroidered-anarkali-set','Flowy anarkali with dupatta and matching bottoms.',3499,2999,'Georgette','Bottle Green',14,'/images/product-9.jpg',true,true),
 ('salwar-sets','Unstitched Cotton Salwar Material','unstitched-cotton-salwar-material','Three-piece unstitched cotton material.',999,NULL,'Cotton','Peach',40,'/images/product-10.jpg',false,false),
 ('salwar-sets','Silk Blend Palazzo Set','silk-blend-palazzo-set','Festive palazzo set with zari detailing.',4299,3799,'Silk Blend','Olive',10,'/images/product-11.jpg',false,true),
 ('kurtis','Printed A-Line Kurti','printed-a-line-kurti','Comfortable A-line kurti with side slits.',899,749,'Rayon','Green Floral',35,'/images/product-12.jpg',true,false),
 ('kurtis','Chikankari Straight Kurti','chikankari-straight-kurti','Delicate chikankari hand embroidery.',1799,NULL,'Cotton','White',18,'/images/product-13.jpg',false,true),
 ('kurtis','Festive Silk Kurti','festive-silk-kurti','Silk kurti with gota patti border.',2299,1999,'Art Silk','Emerald',12,'/images/product-14.jpg',false,false),
 ('dhotis-shirts','Pure Cotton Dhoti with Angavastram','pure-cotton-dhoti-angavastram','Classic 8x4 dhoti set with gold border.',1299,NULL,'Cotton','White & Gold',26,'/images/product-15.jpg',true,false),
 ('dhotis-shirts','Formal Cotton Shirt','formal-cotton-shirt','Soft-touch cotton shirt for daily wear.',1099,899,'Cotton','Sky Blue',30,'/images/product-16.jpg',false,false),
 ('kids-wear','Girls Pattu Pavadai','girls-pattu-pavadai','Traditional silk pavadai sattai for girls.',1899,1599,'Art Silk','Green & Pink',16,'/images/product-17.jpg',true,true),
 ('kids-wear','Boys Silk Kurta Set','boys-silk-kurta-set','Festive kurta and pyjama set for boys.',1599,NULL,'Art Silk','Cream',14,'/images/product-18.jpg',false,true)
) AS v(cat_slug,name,slug,description,price,sale_price,fabric,color,stock,image_url,is_featured,is_new)
JOIN public.categories c ON c.slug = v.cat_slug;