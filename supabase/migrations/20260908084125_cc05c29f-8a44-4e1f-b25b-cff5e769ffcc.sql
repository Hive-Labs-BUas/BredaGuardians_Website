INSERT INTO public.team_players (team_id, name, handle, role, visible, sort_order)
SELECT t.id, 'Player ' || p.idx, 'PLAYER' || p.idx, p.role, true, p.idx
FROM public.teams t
CROSS JOIN (VALUES (1,'Captain'),(2,'Starter'),(3,'Starter'),(4,'Starter'),(5,'Substitute')) AS p(idx, role)
WHERE NOT EXISTS (SELECT 1 FROM public.team_players tp WHERE tp.team_id = t.id);

UPDATE public.match_results mr
SET team_id = t.id
FROM public.teams t
WHERE mr.team_id IS NULL AND lower(t.game) = lower(mr.game);