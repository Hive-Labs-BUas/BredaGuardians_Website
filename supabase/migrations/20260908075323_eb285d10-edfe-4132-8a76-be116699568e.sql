UPDATE public.opening_hours SET opens_at = '09:00', closes_at = '22:00', closed = false, updated_at = now() WHERE day_of_week IN (1,2,3,4);
UPDATE public.opening_hours SET opens_at = '09:00', closes_at = '18:00', closed = false, updated_at = now() WHERE day_of_week = 5;
UPDATE public.opening_hours SET opens_at = NULL, closes_at = NULL, closed = true, updated_at = now() WHERE day_of_week IN (0,6);
INSERT INTO public.special_days (label, day, note, is_closure)
SELECT 'Autumn break', '2026-10-19'::date, 'Autumn break (19-25 October): the Hive is closed for regular opening hours. Community nights pause for the week - keep an eye on Discord for pop-up sessions and online scrims.', true
WHERE NOT EXISTS (SELECT 1 FROM public.special_days WHERE day = '2026-10-19'::date);