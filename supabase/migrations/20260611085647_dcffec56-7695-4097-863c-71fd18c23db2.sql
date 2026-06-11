
-- 1. Recipe images storage: scope writes & listing to owner folder
DROP POLICY IF EXISTS "Authenticated upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Public read recipe images" ON storage.objects;

CREATE POLICY "Users can upload to their recipe folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Listing scoped to owner. Public file access via CDN URLs still works (public bucket).
CREATE POLICY "Users can list their own recipe images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Avatars: drop broad SELECT, scope listing to owner. Public file URLs still work.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Revoke anon EXECUTE from sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.expire_trial() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_trial() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_family_by_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_family_rpc(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leave_family_rpc() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_streak_reward(text, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_user_number(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.find_family_by_invite(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_family_id_for_user(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_member_family_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_store_waitlist() FROM anon, PUBLIC;

-- 4. Realtime channel authorization: only authenticated users may subscribe.
-- Postgres-changes events are still filtered by table RLS on top of this.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write realtime" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can write realtime"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (true);
