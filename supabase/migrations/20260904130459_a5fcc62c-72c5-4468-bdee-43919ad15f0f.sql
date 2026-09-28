REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

DROP POLICY "news_public_read" ON public.news;
CREATE POLICY "news_anon_read" ON public.news FOR SELECT TO anon USING (published);
CREATE POLICY "news_auth_read" ON public.news FOR SELECT TO authenticated USING (published OR public.has_role(auth.uid(),'admin'));

DROP POLICY "research_public_read" ON public.research;
CREATE POLICY "research_anon_read" ON public.research FOR SELECT TO anon USING (published);
CREATE POLICY "research_auth_read" ON public.research FOR SELECT TO authenticated USING (published OR public.has_role(auth.uid(),'admin'));