-- V3: Fix chat notifications always showing the generic fallback name "مستخدم"
-- instead of the actual sender's name.
--
-- Root cause: the trigger only checked public.profiles.full_name (often NULL)
-- and public.sellers/service_providers business_name via a join keyed on the
-- wrong priority. Many real users have their name only in
-- auth.users.raw_user_meta_data (full_name / business_name, set at signup) or
-- have no name at all, so the app's own display-name fallback chain
-- (see src/context/AuthContext.tsx) checks business profile -> user_metadata.full_name
-- -> user_metadata.name -> email prefix -> 'مستخدم'. This migration makes the
-- notification triggers follow the same fallback chain by joining auth.users.

CREATE OR REPLACE FUNCTION public.handle_new_private_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $function$
DECLARE
    sender_name TEXT;
    notification_message TEXT;
    notification_recipient_id UUID;
    product_link TEXT;
BEGIN
    SELECT COALESCE(
        s.business_name,
        p.full_name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'business_name',
        split_part(u.email, '@', 1),
        'مستخدم'
    ) INTO sender_name
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      LEFT JOIN public.sellers s ON s.id = u.id
      WHERE u.id = NEW.sender_id;
    sender_name := COALESCE(sender_name, 'مستخدم');

    product_link := '/products/' || NEW.product_id || '?message_id=' || NEW.id;

    IF NEW.parent_message_id IS NOT NULL THEN
        SELECT sender_id INTO notification_recipient_id FROM public.product_chat WHERE id = NEW.parent_message_id;
        notification_message := 'قام "' || sender_name || '" بالرد على رسالتك.';
    ELSE
        notification_recipient_id := NEW.receiver_id;
        notification_message := 'لديك رسالة جديدة من "' || sender_name || '".';
    END IF;

    IF NEW.sender_id = notification_recipient_id OR notification_recipient_id IS NULL THEN RETURN NEW; END IF;

    INSERT INTO public.notifications (user_id, type, message, link)
    VALUES (notification_recipient_id, CASE WHEN NEW.parent_message_id IS NOT NULL THEN 'NEW_REPLY' ELSE 'NEW_PRIVATE_MESSAGE' END, notification_message, product_link);
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_service_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $function$
DECLARE
    sender_name TEXT;
    notification_message TEXT;
    notification_recipient_id UUID;
    service_link TEXT;
BEGIN
    SELECT COALESCE(
        sp.business_name,
        p.full_name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'business_name',
        split_part(u.email, '@', 1),
        'مستخدم'
    ) INTO sender_name
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      LEFT JOIN public.service_providers sp ON sp.user_id = u.id
      WHERE u.id = NEW.sender_id;
    sender_name := COALESCE(sender_name, 'مستخدم');

    service_link := '/services/' || NEW.service_id || '?message_id=' || NEW.id;

    IF NEW.parent_message_id IS NOT NULL THEN
        SELECT sender_id INTO notification_recipient_id FROM public.service_chat WHERE id = NEW.parent_message_id;
        notification_message := 'قام "' || sender_name || '" بالرد على رسالتك.';
    ELSE
        notification_recipient_id := NEW.receiver_id;
        notification_message := 'لديك رسالة جديدة من "' || sender_name || '".';
    END IF;

    IF NEW.sender_id = notification_recipient_id OR notification_recipient_id IS NULL THEN RETURN NEW; END IF;

    INSERT INTO public.notifications (user_id, type, message, link)
    VALUES (notification_recipient_id, CASE WHEN NEW.parent_message_id IS NOT NULL THEN 'NEW_REPLY' ELSE 'NEW_PRIVATE_MESSAGE' END, notification_message, service_link);
    RETURN NEW;
END;
$function$;
