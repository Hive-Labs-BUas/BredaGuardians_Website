ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_by UUID;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cv_path TEXT,
  ADD COLUMN IF NOT EXISTS letter_path TEXT;

CREATE TABLE IF NOT EXISTS public.site_socials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_socials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_socials TO authenticated;
GRANT ALL ON public.site_socials TO service_role;

ALTER TABLE public.site_socials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "socials_public_read" ON public.site_socials;
CREATE POLICY "socials_public_read" ON public.site_socials
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "socials_admin_write" ON public.site_socials;
CREATE POLICY "socials_admin_write" ON public.site_socials
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS touch_site_socials ON public.site_socials;
CREATE TRIGGER touch_site_socials
  BEFORE UPDATE ON public.site_socials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_socials (platform, label, url, visible, sort_order)
SELECT * FROM (VALUES
  ('discord', 'Discord', 'https://discord.gg/eFtnfWrdHJ', true, 1),
  ('instagram', 'Instagram', 'https://instagram.com', true, 2),
  ('tiktok', 'TikTok', 'https://tiktok.com', true, 3),
  ('youtube', 'YouTube', 'https://youtube.com', true, 4),
  ('twitch', 'Twitch', 'https://twitch.tv', true, 5),
  ('x', 'X', 'https://x.com', true, 6),
  ('linkedin', 'LinkedIn', 'https://linkedin.com', true, 7)
) AS seed(platform, label, url, visible, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.site_socials);