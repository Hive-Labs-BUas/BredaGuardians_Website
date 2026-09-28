CREATE TABLE public.site_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_images_public_read" ON public.site_images FOR SELECT USING (true);
CREATE POLICY "site_images_staff_insert" ON public.site_images FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "site_images_staff_update" ON public.site_images FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "site_images_admin_delete" ON public.site_images FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_images_updated_at BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_images (key, label, url, sort_order) VALUES
  ('about_hero', 'About page — hero picture', '', 1),
  ('about_offer_1', 'About page — The Hive card', '/images/news-hive.jpg', 2),
  ('about_offer_2', 'About page — Competitive Teams card', '/images/hof-valorant.jpg', 3),
  ('about_offer_3', 'About page — Community Events card', '/images/hof-community.jpg', 4),
  ('about_offer_4', 'About page — Guardians Gatherings card', '/images/hof-community.jpg', 5);