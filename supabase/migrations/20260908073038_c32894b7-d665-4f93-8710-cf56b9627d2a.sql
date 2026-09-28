-- 1) New staff role value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'intern';

-- 2) Staff helper (admin OR intern) — text compare so it is safe in this transaction
CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'intern')
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM public;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;

-- 3) Content tables: staff can insert/update, only admins can delete
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['news','research','hall_of_fame','faqs','match_results','interns','intern_positions','shop_products','opening_hours','special_days','site_socials']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', replace(t,'_','_') || '_admin_write', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS news_admin_write ON public.news;
DROP POLICY IF EXISTS research_admin_write ON public.research;
DROP POLICY IF EXISTS hof_admin_write ON public.hall_of_fame;
DROP POLICY IF EXISTS faq_admin_write ON public.faqs;
DROP POLICY IF EXISTS match_results_admin_write ON public.match_results;
DROP POLICY IF EXISTS interns_admin_write ON public.interns;
DROP POLICY IF EXISTS intern_positions_admin_write ON public.intern_positions;
DROP POLICY IF EXISTS shop_products_admin_write ON public.shop_products;
DROP POLICY IF EXISTS hours_admin_write ON public.opening_hours;
DROP POLICY IF EXISTS opening_hours_admin_write ON public.opening_hours;
DROP POLICY IF EXISTS special_days_admin_write ON public.special_days;
DROP POLICY IF EXISTS site_socials_admin_write ON public.site_socials;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['news','research','hall_of_fame','faqs','match_results','interns','intern_positions','shop_products','opening_hours','special_days','site_socials']
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()))', t || '_staff_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()))', t || '_staff_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (private.has_role(auth.uid(), ''admin''::app_role))', t || '_admin_delete', t);
  END LOOP;
END $$;

-- 4) Staff-visible reads for unpublished/hidden rows
DROP POLICY IF EXISTS news_auth_read ON public.news;
CREATE POLICY news_auth_read ON public.news FOR SELECT TO authenticated USING (published OR private.is_staff(auth.uid()));
DROP POLICY IF EXISTS research_auth_read ON public.research;
CREATE POLICY research_auth_read ON public.research FOR SELECT TO authenticated USING (published OR private.is_staff(auth.uid()));
DROP POLICY IF EXISTS match_results_auth_read ON public.match_results;
CREATE POLICY match_results_auth_read ON public.match_results FOR SELECT TO authenticated USING (visible OR private.is_staff(auth.uid()));
DROP POLICY IF EXISTS interns_auth_read ON public.interns;
CREATE POLICY interns_auth_read ON public.interns FOR SELECT TO authenticated USING (visible OR private.is_staff(auth.uid()));
DROP POLICY IF EXISTS intern_positions_auth_read ON public.intern_positions;
CREATE POLICY intern_positions_auth_read ON public.intern_positions FOR SELECT TO authenticated USING (active OR private.is_staff(auth.uid()));

-- 5) Requests: staff may read and handle, only admins may delete
DROP POLICY IF EXISTS contact_admin_read ON public.contact_submissions;
CREATE POLICY contact_staff_read ON public.contact_submissions FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS contact_admin_update ON public.contact_submissions;
CREATE POLICY contact_staff_update ON public.contact_submissions FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

DROP POLICY IF EXISTS applications_admin_read ON public.applications;
CREATE POLICY applications_staff_read ON public.applications FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS applications_admin_update ON public.applications;
CREATE POLICY applications_staff_update ON public.applications FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- 6) Teams and rosters
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  game text NOT NULL,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  blurb text NOT NULL DEFAULT '',
  image_url text,
  logo_url text,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_anon_read ON public.teams FOR SELECT TO anon USING (visible);
CREATE POLICY teams_auth_read ON public.teams FOR SELECT TO authenticated USING (visible OR private.is_staff(auth.uid()));
CREATE POLICY teams_staff_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY teams_staff_update ON public.teams FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY teams_admin_delete ON public.teams FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER teams_touch BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  handle text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  photo_url text,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_players TO authenticated;
GRANT ALL ON public.team_players TO service_role;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_players_anon_read ON public.team_players FOR SELECT TO anon USING (visible);
CREATE POLICY team_players_auth_read ON public.team_players FOR SELECT TO authenticated USING (visible OR private.is_staff(auth.uid()));
CREATE POLICY team_players_staff_insert ON public.team_players FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY team_players_staff_update ON public.team_players FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY team_players_admin_delete ON public.team_players FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER team_players_touch BEFORE UPDATE ON public.team_players FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.match_results ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- 7) Seed the five divisions
INSERT INTO public.teams (slug, game, name, tagline, blurb, sort_order) VALUES
  ('valorant', 'Valorant', 'Guardians Valorant', 'Tactical FPS flagship', 'Our flagship tactical FPS squad — Dutch Valorant champions and Dutch Student League regulars, training weekly at The Hive.', 1),
  ('counter-strike-2', 'Counter-Strike 2', 'Guardians CS2', 'The classic FPS division', 'The classic FPS division, competing in Dutch and BeNeLux CS2 circuits with a mix of student and community talent.', 2),
  ('rocket-league', 'Rocket League', 'Guardians Rocket League', 'High-octane 3v3', 'High-octane 3v3 car soccer squad grinding RLCS-adjacent brackets and Dutch student cups.', 3),
  ('league-of-legends', 'League of Legends', 'Guardians League of Legends', 'Summoner''s Rift', 'Summoner''s Rift roster representing Breda in the Dutch student scene, with weekly scrims and coaching.', 4),
  ('super-smash-bros-ultimate', 'Super Smash Bros. Ultimate', 'Guardians Smash', 'Fighting game community', 'Our fighting-game community reppin'' Breda at Dutch Smash weeklies and campus brawls.', 5);
