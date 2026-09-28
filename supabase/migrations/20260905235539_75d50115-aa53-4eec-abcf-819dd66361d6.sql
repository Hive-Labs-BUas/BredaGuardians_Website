GRANT SELECT ON public.interns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.interns TO authenticated;
GRANT ALL ON public.interns TO service_role;

GRANT SELECT ON public.intern_positions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.intern_positions TO authenticated;
GRANT ALL ON public.intern_positions TO service_role;

GRANT SELECT ON public.match_results TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;