DROP POLICY IF EXISTS interns_public_read ON public.interns;
CREATE POLICY interns_anon_read ON public.interns FOR SELECT TO anon USING (visible);
CREATE POLICY interns_auth_read ON public.interns FOR SELECT TO authenticated USING (visible OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS intern_positions_public_read ON public.intern_positions;
CREATE POLICY intern_positions_anon_read ON public.intern_positions FOR SELECT TO anon USING (active);
CREATE POLICY intern_positions_auth_read ON public.intern_positions FOR SELECT TO authenticated USING (active OR private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS match_results_public_read ON public.match_results;
CREATE POLICY match_results_anon_read ON public.match_results FOR SELECT TO anon USING (visible);
CREATE POLICY match_results_auth_read ON public.match_results FOR SELECT TO authenticated USING (visible OR private.has_role(auth.uid(), 'admin'::app_role));