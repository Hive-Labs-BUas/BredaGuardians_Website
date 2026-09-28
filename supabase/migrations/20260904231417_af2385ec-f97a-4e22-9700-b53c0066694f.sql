CREATE TABLE public.membership_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  tier text,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.membership_events TO authenticated;
GRANT ALL ON public.membership_events TO service_role;

ALTER TABLE public.membership_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_events_admin_read" ON public.membership_events
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_membership_events_created_at ON public.membership_events(created_at DESC);