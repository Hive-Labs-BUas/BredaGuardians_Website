CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  position text NOT NULL,
  motivation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_anyone_insert" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "applications_admin_read" ON public.applications FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "applications_admin_update" ON public.applications FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "applications_admin_delete" ON public.applications FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));