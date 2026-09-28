CREATE TABLE public.protected_accounts (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.protected_accounts TO service_role;
ALTER TABLE public.protected_accounts ENABLE ROW LEVEL SECURITY;

INSERT INTO public.protected_accounts (email) VALUES ('leppens.j@buas.nl');

CREATE OR REPLACE FUNCTION public.is_protected_account(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u JOIN public.protected_accounts p ON lower(p.email) = lower(u.email)
    WHERE u.id = _user_id
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_protected_account(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_protected_account(uuid) TO authenticated, service_role;

CREATE POLICY user_roles_protect_update ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (NOT public.is_protected_account(user_id) OR auth.uid() = user_id);
CREATE POLICY user_roles_protect_delete ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (NOT public.is_protected_account(user_id) OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  IF EXISTS (SELECT 1 FROM public.protected_accounts WHERE lower(email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;