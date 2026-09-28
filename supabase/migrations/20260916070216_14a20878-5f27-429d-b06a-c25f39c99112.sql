CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  value text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "site_settings_staff_insert"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR private.has_role(auth.uid(), 'intern'::public.app_role)
);

CREATE POLICY "site_settings_staff_update"
ON public.site_settings FOR UPDATE
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR private.has_role(auth.uid(), 'intern'::public.app_role)
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::public.app_role)
  OR private.has_role(auth.uid(), 'intern'::public.app_role)
);

CREATE POLICY "site_settings_admin_delete"
ON public.site_settings FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER touch_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (key, label, value, description)
VALUES (
  'minecraft_server',
  'Minecraft server',
  'Bredaguardians.server.nl',
  'Join the Breda Guardians Minecraft community server.'
);