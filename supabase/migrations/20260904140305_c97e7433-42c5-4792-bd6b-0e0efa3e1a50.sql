CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY user_roles_own_read ON public.user_roles
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY user_roles_admin_all ON public.user_roles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY news_admin_write ON public.news
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY news_auth_read ON public.news
  USING (published OR private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY research_admin_write ON public.research
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY research_auth_read ON public.research
  USING (published OR private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY hof_admin_write ON public.hall_of_fame
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY hours_admin_write ON public.opening_hours
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY special_admin_write ON public.special_days
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY faq_admin_write ON public.faqs
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY contact_admin_read ON public.contact_submissions
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY contact_admin_delete ON public.contact_submissions
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY news_signup_admin_read ON public.newsletter_signups
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY news_signup_admin_delete ON public.newsletter_signups
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY memberships_own_read ON public.memberships
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY memberships_own_update ON public.memberships
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY orders_own_read ON public.orders
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.has_role(uuid, public.app_role);