-- Match results shown on the Hall of Fame page
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome text NOT NULL DEFAULT 'VICTORY',
  competition text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT '',
  game text NOT NULL DEFAULT '',
  opponent text NOT NULL DEFAULT '',
  opponent_logo_url text,
  team_logo_url text,
  score_us integer NOT NULL DEFAULT 0,
  score_them integer NOT NULL DEFAULT 0,
  played_at timestamptz NOT NULL DEFAULT now(),
  stream_url text,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.match_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_results_public_read ON public.match_results
  FOR SELECT TO anon, authenticated
  USING (visible OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY match_results_admin_write ON public.match_results
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER match_results_touch BEFORE UPDATE ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Intern profiles
CREATE TABLE public.interns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  photo_url text,
  blurb text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.interns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interns TO authenticated;
GRANT ALL ON public.interns TO service_role;

ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;

CREATE POLICY interns_public_read ON public.interns
  FOR SELECT TO anon, authenticated
  USING (visible OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY interns_admin_write ON public.interns
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER interns_touch BEFORE UPDATE ON public.interns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Open intern positions
CREATE TABLE public.intern_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.intern_positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intern_positions TO authenticated;
GRANT ALL ON public.intern_positions TO service_role;

ALTER TABLE public.intern_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY intern_positions_public_read ON public.intern_positions
  FOR SELECT TO anon, authenticated
  USING (active OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY intern_positions_admin_write ON public.intern_positions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER intern_positions_touch BEFORE UPDATE ON public.intern_positions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Workflow fields for incoming requests
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS internal_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS handled_by uuid,
  ADD COLUMN IF NOT EXISTS handled_at timestamptz;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS internal_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS handled_by uuid,
  ADD COLUMN IF NOT EXISTS handled_at timestamptz;

CREATE POLICY contact_admin_update ON public.contact_submissions
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- Seed current intern profiles and open positions
INSERT INTO public.interns (name, role, photo_url, blurb, sort_order) VALUES
  ('Daan Verhoeven', 'Event Manager', '/images/intern-event.jpg', 'Runs our play nights, LAN days and tournaments — from first idea to final scoreboard.', 1),
  ('Sanne van den Berg', 'Content Marketing Manager', '/images/intern-content.jpg', 'Turns matches and community moments into posts, clips and campaigns that grow the Hive.', 2),
  ('Milan de Jong', 'Overall Manager', '/images/intern-manager.jpg', 'Keeps the whole operation moving: planning, partners, the intern team and daily decisions.', 3),
  ('Lieke Janssen', 'Research Intern', '/images/intern-research.jpg', 'Works with BUas staff on esports research and publishes findings the community can use.', 4);

INSERT INTO public.intern_positions (title, description, sort_order) VALUES
  ('Event Manager', 'Plan and run our play nights, LAN days and tournaments from first idea to final scoreboard.', 1),
  ('Content Marketing Manager', 'Turn matches and community moments into social posts, clips and campaigns that grow the Hive.', 2),
  ('Overall Manager', 'Keep the whole operation moving: planning, partners, the intern team and day-to-day decisions.', 3),
  ('Research Intern', 'Work with BUas staff on esports research projects and publish findings the community can use.', 4);

-- Seed the current Hall of Fame results
INSERT INTO public.match_results (outcome, competition, stage, game, opponent, score_us, score_them, played_at) VALUES
  ('VICTORY', 'Road of Legends', 'Week 6', 'League of Legends', 'The Bandits', 2, 1, '2026-05-05 18:00+02'),
  ('VICTORY', 'Student Cup NL', 'Semi-Final', 'Valorant', 'Utrecht Wolves', 13, 9, '2026-04-28 19:30+02'),
  ('DEFEAT', 'Collegiate Series', 'Week 4', 'Rocket League', 'Delft Dynamos', 1, 3, '2026-04-21 20:00+02');