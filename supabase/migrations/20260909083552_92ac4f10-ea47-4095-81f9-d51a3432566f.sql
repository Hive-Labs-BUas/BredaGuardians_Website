CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  referrer text,
  country text,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX page_views_day_idx ON public.page_views (day);
CREATE INDEX page_views_path_idx ON public.page_views (path);

GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a page view"
  ON public.page_views FOR INSERT TO anon, authenticated
  WITH CHECK (true);