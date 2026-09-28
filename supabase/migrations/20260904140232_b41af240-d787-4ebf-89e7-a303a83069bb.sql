INSERT INTO public.news (title, slug, excerpt, content, image_url, published, publish_date)
VALUES
  ('Placeholder News Post 1', 'placeholder-news-post-1', 'Test article for checking the News management layout and editing flow.', 'This is placeholder content for testing the Breda Guardians News editor. Replace or delete this post when real editorial content is ready.', '/images/news-valorant.jpg', true, CURRENT_DATE),
  ('Placeholder News Post 2', 'placeholder-news-post-2', 'A second removable article used to verify list, edit and delete actions.', 'This clearly labeled placeholder makes it easy to test the complete News publishing workflow in the Admin Panel.', '/images/news-hive.jpg', true, CURRENT_DATE - 7),
  ('Placeholder News Post 3', 'placeholder-news-post-3', 'An unpublished draft used to test visibility controls.', 'This placeholder starts as an unpublished draft so staff can verify draft editing and publishing.', '/images/news-tryouts.jpg', false, CURRENT_DATE - 14)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.research (title, category, summary, cover_image_url, link_url, published, entry_date)
SELECT * FROM (VALUES
  ('Placeholder Research Post 1'::text, 'Case Study'::text, 'Test research entry for checking the Research management layout and editing flow.'::text, '/images/research-coaching.jpg'::text, 'https://example.com/placeholder-research-1'::text, true, CURRENT_DATE),
  ('Placeholder Research Post 2'::text, 'Survey'::text, 'A removable research item used to verify list, edit and delete actions.'::text, '/images/research-survey.jpg'::text, 'https://example.com/placeholder-research-2'::text, true, CURRENT_DATE - 7),
  ('Placeholder Research Post 3'::text, 'Report'::text, 'An unpublished placeholder used to test research visibility controls.'::text, '/images/research-venue.jpg'::text, 'https://example.com/placeholder-research-3'::text, false, CURRENT_DATE - 14)
) AS seed(title, category, summary, cover_image_url, link_url, published, entry_date)
WHERE NOT EXISTS (
  SELECT 1 FROM public.research WHERE public.research.title = seed.title
);