-- V5: Add a SECURITY DEFINER RPC that resolves a safe display name + avatar for any
-- chat participant, reusing the same fallback chain already used by the chat
-- notification triggers (V3): business profile -> profiles.full_name ->
-- user_metadata.full_name -> user_metadata.name -> user_metadata.business_name ->
-- email prefix -> 'مستخدم'.
--
-- Why: dallah-discussion-section.tsx previously resolved sender names by querying
-- public.profiles directly from the browser. Most profiles.full_name values are
-- NULL, and the client cannot read auth.users (email/metadata) due to RLS, so real
-- messages rendered as a generic "مستخدم" instead of the richer name shown before.
-- This function runs with elevated privileges so it can safely read auth.users on
-- the server side and return only a display name + avatar (no other auth data).

CREATE OR REPLACE FUNCTION public.get_chat_display_info(user_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT
    u.id,
    COALESCE(
      s.business_name,
      sp.business_name,
      p.full_name,
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'business_name',
      split_part(u.email, '@', 1),
      'مستخدم'
    ) AS display_name,
    COALESCE(s.logo_url, sp.logo_url, sp.avatar_url, p.avatar_url) AS avatar_url
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.sellers s ON s.id = u.id
  LEFT JOIN public.service_providers sp ON sp.user_id = u.id
  WHERE u.id = ANY(user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_display_info(uuid[]) TO authenticated, anon;
