ALTER TABLE public.interns ADD COLUMN IF NOT EXISTS linkedin_url text;
DELETE FROM public.site_socials WHERE platform IN ('x','twitter');