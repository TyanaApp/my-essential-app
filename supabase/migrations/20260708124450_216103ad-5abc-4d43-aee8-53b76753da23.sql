-- 1) Scope realtime.messages broadcast/presence policies to the user's own topic namespace.
DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write realtime" ON realtime.messages;

CREATE POLICY "Users read own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
);

CREATE POLICY "Users write own realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
);

-- 2) Revoke public/anon EXECUTE on SECURITY DEFINER RPCs (still callable by authenticated users).
REVOKE EXECUTE ON FUNCTION public.count_store_waitlist() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.find_family_by_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_family_id_for_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_member_family_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_family_by_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_family_rpc(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.leave_family_rpc() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.activate_trial() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.expire_trial() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_streak_reward(text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_user_number(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.count_store_waitlist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_family_by_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_id_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_family_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_family_by_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_family_rpc(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_family_rpc() TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_streak_reward(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_number(uuid) TO authenticated;
-- handle_new_user is invoked by auth trigger only; keep default (no anon access needed).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;