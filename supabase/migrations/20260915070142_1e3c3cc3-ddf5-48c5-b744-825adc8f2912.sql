ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'captain';

ALTER TABLE public.team_players
  ADD COLUMN IF NOT EXISTS country_codes text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION private.is_captain(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'captain'
  );
$$;

DROP POLICY IF EXISTS team_players_staff_insert ON public.team_players;
CREATE POLICY team_players_staff_insert ON public.team_players
  FOR INSERT TO authenticated
  WITH CHECK (private.is_staff(auth.uid()) OR private.is_captain(auth.uid()));

DROP POLICY IF EXISTS team_players_staff_update ON public.team_players;
CREATE POLICY team_players_staff_update ON public.team_players
  FOR UPDATE TO authenticated
  USING (private.is_staff(auth.uid()) OR private.is_captain(auth.uid()))
  WITH CHECK (private.is_staff(auth.uid()) OR private.is_captain(auth.uid()));

DROP POLICY IF EXISTS team_players_auth_read ON public.team_players;
CREATE POLICY team_players_auth_read ON public.team_players
  FOR SELECT TO authenticated
  USING (visible OR private.is_staff(auth.uid()) OR private.is_captain(auth.uid()));

DROP POLICY IF EXISTS teams_auth_read ON public.teams;
CREATE POLICY teams_auth_read ON public.teams
  FOR SELECT TO authenticated
  USING (visible OR private.is_staff(auth.uid()) OR private.is_captain(auth.uid()));