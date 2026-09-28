-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','member');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Guardian',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_own_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- profile auto-create
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- NEWS
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  image_url text,
  published boolean NOT NULL DEFAULT true,
  publish_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_public_read" ON public.news FOR SELECT USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "news_admin_write" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER news_touch BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RESEARCH
CREATE TABLE public.research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Case Study',
  summary text NOT NULL DEFAULT '',
  cover_image_url text,
  link_url text,
  published boolean NOT NULL DEFAULT true,
  entry_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.research TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research TO authenticated;
GRANT ALL ON public.research TO service_role;
ALTER TABLE public.research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "research_public_read" ON public.research FOR SELECT USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "research_admin_write" ON public.research FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER research_touch BEFORE UPDATE ON public.research FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- HALL OF FAME
CREATE TABLE public.hall_of_fame (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  achieved_on date NOT NULL DEFAULT current_date,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hall_of_fame TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hall_of_fame TO authenticated;
GRANT ALL ON public.hall_of_fame TO service_role;
ALTER TABLE public.hall_of_fame ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hof_public_read" ON public.hall_of_fame FOR SELECT USING (true);
CREATE POLICY "hof_admin_write" ON public.hall_of_fame FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER hof_touch BEFORE UPDATE ON public.hall_of_fame FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- OPENING HOURS
CREATE TABLE public.opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL UNIQUE,
  opens_at text,
  closes_at text,
  closed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opening_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opening_hours TO authenticated;
GRANT ALL ON public.opening_hours TO service_role;
ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours_public_read" ON public.opening_hours FOR SELECT USING (true);
CREATE POLICY "hours_admin_write" ON public.opening_hours FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER hours_touch BEFORE UPDATE ON public.opening_hours FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.special_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  day date NOT NULL,
  note text NOT NULL DEFAULT '',
  is_closure boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.special_days TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_days TO authenticated;
GRANT ALL ON public.special_days TO service_role;
ALTER TABLE public.special_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "special_public_read" ON public.special_days FOR SELECT USING (true);
CREATE POLICY "special_admin_write" ON public.special_days FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- FAQ
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'General',
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_public_read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "faq_admin_write" ON public.faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER faq_touch BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONTACT
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_anyone_insert" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact_admin_read" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "contact_admin_delete" ON public.contact_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- NEWSLETTER
CREATE TABLE public.newsletter_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_signups TO anon, authenticated;
GRANT SELECT, DELETE ON public.newsletter_signups TO authenticated;
GRANT ALL ON public.newsletter_signups TO service_role;
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_signup_insert" ON public.newsletter_signups FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "news_signup_admin_read" ON public.newsletter_signups FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "news_signup_admin_delete" ON public.newsletter_signups FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- MEMBERSHIPS
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_own_read" ON public.memberships FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "memberships_own_write" ON public.memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memberships_own_update" ON public.memberships FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_own_read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders_own_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- SEED
INSERT INTO public.opening_hours (day_of_week, opens_at, closes_at, closed) VALUES
  (1,'12:00','22:00',false),
  (2,'12:00','22:00',false),
  (3,'12:00','23:00',false),
  (4,'12:00','22:00',false),
  (5,'12:00','00:00',false),
  (6,'14:00','00:00',false),
  (0,null,null,true);

INSERT INTO public.special_days (label, day, note, is_closure) VALUES
  ('Winter break closure','2026-12-24','The Hive is closed from 24 December until 2 January.',true),
  ('Guardians LAN Night','2026-10-17','Open late until 03:00 for the autumn LAN.',false);

INSERT INTO public.faqs (category, question, answer, sort_order) VALUES
  ('Getting Started','Do I have to study at BUas to join?','Our competitive rosters are open to BUas students first, but the community, events and the Hive welcome anyone in the Breda area who plays with respect.',1),
  ('Getting Started','How do I join the community?','Create an account on this site and join our Discord. From there you can sign up for open play nights, scrims and tryouts.',2),
  ('Getting Started','Does it cost anything?','Joining the community is free. A paid membership unlocks Hive priority booking, coaching blocks and merch discounts.',3),
  ('Teams & Tryouts','When are tryouts held?','Tryouts run at the start of each academic block. Announcements go out on the News page and in Discord.',1),
  ('Teams & Tryouts','Which titles do you compete in?','Valorant, League of Legends, Rocket League and EA FC, with community play across many more.',2),
  ('The Hive','Where is the Hive?','The Hive is our physical gaming space on the BUas campus in Breda, Netherlands.',1),
  ('The Hive','Can I bring my own peripherals?','Absolutely. Bring your keyboard, mouse and headset - our stations are plug and play.',2),
  ('Membership','Can I cancel my membership?','Yes. Memberships run per academic year and can be cancelled at any time from your account page.',1),
  ('Membership','How do I get an invoice?','Your account page keeps a full order history. Contact us for a formal invoice for study or sponsor purposes.',2);

INSERT INTO public.news (title, slug, excerpt, content, image_url, publish_date) VALUES
  ('Guardians Valorant roster takes the BUas Cup','valorant-roster-takes-buas-cup','Our Valorant main roster closed out the BUas Cup with a 3-1 grand final win in front of a packed Hive.','Our Valorant main roster closed out the BUas Cup with a 3-1 grand final win in front of a packed Hive. The squad dropped only two maps across the entire bracket and the crowd on campus made the final feel like an arena event.','/images/news-valorant.jpg','2026-08-28'),
  ('The Hive gets a hardware upgrade','hive-hardware-upgrade','Twelve new stations, 240Hz panels and a dedicated broadcast desk landed at the Hive this summer.','Twelve new stations, 240Hz panels and a dedicated broadcast desk landed at the Hive this summer. Members get priority booking on the new row from day one, and the broadcast desk means every home match can now be streamed properly.','/images/news-hive.jpg','2026-08-12'),
  ('Open tryouts for the new season are live','open-tryouts-new-season','Four rosters, one week of tryouts. Sign-ups are open to every BUas student.','Four rosters, one week of tryouts. Sign-ups are open to every BUas student and close at the end of the month. Bring your peak rank, but bring your attitude first - we build teams that last a season, not a weekend.','/images/news-tryouts.jpg','2026-07-30');

INSERT INTO public.research (title, category, summary, cover_image_url, link_url, entry_date) VALUES
  ('Student Esports Wellbeing Survey 2026','Community Survey','How 340 BUas students balance competitive play, study load and sleep - and what changed after the Hive opened.','/images/research-survey.jpg','#','2026-06-18'),
  ('Building a Campus Esports Venue','Case Study','A full breakdown of how the Hive went from an empty room to a 24-station competitive venue in eleven months.','/images/research-venue.jpg','#','2026-04-02'),
  ('Coaching Structures in Amateur Valorant','Case Study','What actually moves the needle for student rosters: review cadence, role clarity and honest feedback loops.','/images/research-coaching.jpg','#','2026-02-11'),
  ('Inclusivity in Dutch Student Esports','Community Survey','A look at who feels welcome in student esports spaces in the Netherlands, and the practical gaps we found.','/images/research-inclusivity.jpg','#','2025-11-20');

INSERT INTO public.hall_of_fame (title, description, image_url, achieved_on, sort_order) VALUES
  ('BUas Cup Champions - Valorant','A 3-1 grand final win to close a near-flawless bracket run.','/images/hof-valorant.jpg','2026-08-28',1),
  ('Dutch Student League Finalists - League of Legends','Second place nationally after a five-game final that went the distance.','/images/hof-lol.jpg','2026-05-16',2),
  ('Rocket League Regional Winners','Back-to-back regional titles for the Guardians RL trio.','/images/hof-rl.jpg','2026-03-08',3),
  ('Community Team of the Year','Recognised by BUas for the impact of the Hive on student life.','/images/hof-community.jpg','2025-12-05',4);