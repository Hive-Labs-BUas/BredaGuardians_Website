UPDATE public.faqs SET answer = 'Membership unlocks extra perks on top of free community access. Supporter is €15 for 3 months, Champion is €30 for 6 months and Legendary is €50 for a full year — see our Membership page for the full breakdown of what each tier includes.' WHERE question ILIKE 'What does membership include%';

UPDATE public.faqs SET answer = 'Log in on the Membership page and request the tier you want. There is no online payment — you pay in person at The Hive during opening hours, and our staff mark your payment as received. Your account shows your membership as active straight after that.' WHERE question ILIKE 'How do I purchase membership%';

INSERT INTO public.faqs (category, question, answer, sort_order)
SELECT 'Membership', 'How do I pay for my membership?', 'Payment happens in person at The Hive. Request your tier on the website, then pay our staff during opening hours (cash or card). They register your payment and your membership activates on your account right away.', 40
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question = 'How do I pay for my membership?');

INSERT INTO public.faqs (category, question, answer, sort_order)
SELECT 'Membership', 'How long does a membership last?', 'It depends on the tier you pick: Supporter runs for 3 months, Champion for 6 months and Legendary for a full year. Your account shows the date your membership runs until.', 41
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question = 'How long does a membership last?');