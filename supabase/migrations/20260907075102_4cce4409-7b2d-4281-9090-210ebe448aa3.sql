CREATE TABLE public.shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'apparel',
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL DEFAULT 0,
  sizes text[] NOT NULL DEFAULT '{}',
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shop_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_products TO authenticated;
GRANT ALL ON public.shop_products TO service_role;

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_products_anon_read ON public.shop_products
  FOR SELECT TO anon USING (visible);
CREATE POLICY shop_products_auth_read ON public.shop_products
  FOR SELECT TO authenticated USING (visible OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY shop_products_admin_write ON public.shop_products
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER shop_products_touch BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.shop_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  email text,
  size text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'awaiting_payment',
  note text NOT NULL DEFAULT '',
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.shop_requests TO authenticated;
GRANT ALL ON public.shop_requests TO service_role;

ALTER TABLE public.shop_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_requests_own_insert ON public.shop_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY shop_requests_own_read ON public.shop_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY shop_requests_admin_update ON public.shop_requests
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER shop_requests_touch BEFORE UPDATE ON public.shop_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.shop_products (name, slug, category, description, price_cents, sizes, in_stock, visible, sort_order) VALUES
('Guardians Home Jersey', 'guardians-home-jersey', 'apparel', 'Our matchday jersey in gold on black — the same kit our rosters wear on stage.', 4500, ARRAY['S','M','L','XL','XXL'], true, true, 1),
('Training Hoodie', 'training-hoodie', 'apparel', 'Heavyweight hoodie with an embroidered crest. Built for late scrims at The Hive.', 5500, ARRAY['S','M','L','XL','XXL'], true, true, 2),
('Guardians Tee', 'guardians-tee', 'apparel', 'Soft cotton tee with the Guardians wordmark. The easy everyday pick.', 2500, ARRAY['S','M','L','XL'], true, true, 3),
('Snapback Cap', 'snapback-cap', 'apparel', 'Flat-brim snapback with a gold crest. One size, adjustable strap.', 2000, ARRAY['One size'], true, true, 4),
('XL Desk Mat', 'xl-desk-mat', 'accessories', 'Full-desk cloth mat with stitched edges, sized for keyboard and mouse.', 3000, ARRAY['90x40 cm'], true, true, 5),
('Guardians Keychain', 'guardians-keychain', 'accessories', 'Enamel crest keychain — small, sturdy and very giftable.', 700, ARRAY[]::text[], true, true, 6),
('Water Bottle', 'water-bottle', 'accessories', '750 ml matte bottle with the crest. Stay hydrated through a bo5.', 1500, ARRAY[]::text[], true, true, 7),
('Sticker Pack', 'sticker-pack', 'accessories', 'Eight vinyl stickers for your laptop, deck or peripheral case.', 500, ARRAY[]::text[], true, true, 8),
('Lanyard', 'lanyard', 'accessories', 'Woven lanyard with a safety clip — perfect for your campus pass.', 800, ARRAY[]::text[], true, true, 9);