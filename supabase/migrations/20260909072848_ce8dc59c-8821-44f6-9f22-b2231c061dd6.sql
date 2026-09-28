-- Players: nationality + age
ALTER TABLE public.team_players
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS birth_date date;

-- Interns: core team, alumni, period
ALTER TABLE public.interns
  ADD COLUMN IF NOT EXISTS is_core boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alumni boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_on date,
  ADD COLUMN IF NOT EXISTS ended_on date;

-- Articles: attached documents everywhere, full body for research + hall of fame
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_name text;

ALTER TABLE public.research
  ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_name text;

ALTER TABLE public.hall_of_fame
  ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_name text;

-- Upcoming matches live alongside results
ALTER TABLE public.match_results
  ALTER COLUMN score_us DROP NOT NULL,
  ALTER COLUMN score_them DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'played';

UPDATE public.match_results SET status = 'played' WHERE status IS DISTINCT FROM 'scheduled';

ALTER TABLE public.match_results
  ADD CONSTRAINT match_results_status_check CHECK (status IN ('scheduled', 'played'));

-- Restore the teams that were switched to hidden
UPDATE public.teams SET visible = true WHERE slug IN ('rocket-league', 'league-of-legends', 'super-smash-bros-ultimate');