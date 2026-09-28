CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '.', 1));

CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '.', 1));

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '.', 1))
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '.', 1));

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = split_part(name, '.', 1));

CREATE POLICY "Admins can view all avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND private.has_role(auth.uid(), 'admin'::app_role));