-- V7: Add sender_logo_url to notifications table and update all triggers to populate it.
-- This allows the navbar notification list to show the sender's avatar/logo.

-- 1. Add column (idempotent)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_logo_url TEXT;

-- ================================================================
-- 2. handle_new_private_message_notification  (product_chat)
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_private_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $function$
DECLARE
    sender_name         TEXT;
    sender_logo         TEXT;
    notification_message TEXT;
    notification_recipient_id UUID;
    product_link        TEXT;
BEGIN
    -- Resolve best display name (same chain as V3)
    SELECT COALESCE(
        s.business_name,
        p.full_name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'business_name',
        split_part(u.email, '@', 1),
        'مستخدم'
    ), COALESCE(s.logo_url, sp.logo_url, p.avatar_url)
    INTO sender_name, sender_logo
    FROM auth.users u
    LEFT JOIN public.profiles p   ON p.id = u.id
    LEFT JOIN public.sellers s    ON s.id = u.id
    LEFT JOIN public.service_providers sp ON sp.user_id = u.id
    WHERE u.id = NEW.sender_id;

    sender_name := COALESCE(sender_name, 'مستخدم');
    product_link := '/products/' || NEW.product_id || '?message_id=' || NEW.id;

    IF NEW.parent_message_id IS NOT NULL THEN
        SELECT sender_id INTO notification_recipient_id
          FROM public.product_chat WHERE id = NEW.parent_message_id;
        notification_message := 'قام "' || sender_name || '" بالرد على رسالتك.';
    ELSE
        notification_recipient_id := NEW.receiver_id;
        notification_message := 'لديك رسالة جديدة من "' || sender_name || '".';
    END IF;

    IF NEW.sender_id = notification_recipient_id OR notification_recipient_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, message, link, sender_logo_url)
    VALUES (
        notification_recipient_id,
        CASE WHEN NEW.parent_message_id IS NOT NULL THEN 'NEW_REPLY' ELSE 'NEW_PRIVATE_MESSAGE' END,
        notification_message,
        product_link,
        sender_logo
    );
    RETURN NEW;
END;
$function$;

-- ================================================================
-- 3. handle_new_service_message_notification  (service_chat)
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_service_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth, pg_temp
AS $function$
DECLARE
    sender_name         TEXT;
    sender_logo         TEXT;
    notification_message TEXT;
    notification_recipient_id UUID;
    service_link        TEXT;
BEGIN
    SELECT COALESCE(
        sp.business_name,
        p.full_name,
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'business_name',
        split_part(u.email, '@', 1),
        'مستخدم'
    ), COALESCE(s.logo_url, sp.logo_url, p.avatar_url)
    INTO sender_name, sender_logo
    FROM auth.users u
    LEFT JOIN public.profiles p   ON p.id = u.id
    LEFT JOIN public.sellers s    ON s.id = u.id
    LEFT JOIN public.service_providers sp ON sp.user_id = u.id
    WHERE u.id = NEW.sender_id;

    sender_name := COALESCE(sender_name, 'مستخدم');
    service_link := '/services/' || NEW.service_id || '?message_id=' || NEW.id;

    IF NEW.parent_message_id IS NOT NULL THEN
        SELECT sender_id INTO notification_recipient_id
          FROM public.service_chat WHERE id = NEW.parent_message_id;
        notification_message := 'قام "' || sender_name || '" بالرد على رسالتك.';
    ELSE
        notification_recipient_id := NEW.receiver_id;
        notification_message := 'لديك رسالة جديدة من "' || sender_name || '".';
    END IF;

    IF NEW.sender_id = notification_recipient_id OR notification_recipient_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, message, link, sender_logo_url)
    VALUES (
        notification_recipient_id,
        CASE WHEN NEW.parent_message_id IS NOT NULL THEN 'NEW_REPLY' ELSE 'NEW_PRIVATE_MESSAGE' END,
        notification_message,
        service_link,
        sender_logo
    );
    RETURN NEW;
END;
$function$;

-- ================================================================
-- 4. handle_new_product_review_notification
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_product_review_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    product_name  TEXT;
    seller_id_val UUID;
    reviewer_logo TEXT;
BEGIN
    IF NEW.parent_review_id IS NULL THEN
        SELECT p.name, p.seller_id
          INTO product_name, seller_id_val
          FROM public.products p WHERE p.id = NEW.product_id;

        -- Fetch reviewer avatar/logo
        SELECT COALESCE(s.logo_url, sp.logo_url, pr.avatar_url)
          INTO reviewer_logo
          FROM auth.users u
          LEFT JOIN public.profiles pr ON pr.id = u.id
          LEFT JOIN public.sellers s   ON s.id = u.id
          LEFT JOIN public.service_providers sp ON sp.user_id = u.id
          WHERE u.id = NEW.user_id;

        IF seller_id_val IS NOT NULL AND NEW.user_id IS DISTINCT FROM seller_id_val THEN
            INSERT INTO public.notifications (user_id, type, message, link, sender_logo_url)
            VALUES (
                seller_id_val,
                'new_review',
                'تقييم جديد من "' || COALESCE(NEW.user_name, 'مستخدم') || '" على منتجك "' || COALESCE(product_name,'') || '".',
                '/products/' || NEW.product_id::text,
                reviewer_logo
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- ================================================================
-- 5. handle_new_service_review_notification
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_service_review_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    service_name_val TEXT;
    provider_user_id UUID;
    reviewer_logo    TEXT;
BEGIN
    IF NEW.parent_review_id IS NULL THEN
        SELECT s.name, COALESCE(sp.user_id, sp.id)
          INTO service_name_val, provider_user_id
          FROM public.services s
          JOIN public.service_providers sp ON sp.id = s.service_provider_id
          WHERE s.id = NEW.service_id;

        SELECT COALESCE(sel.logo_url, sp2.logo_url, p.avatar_url)
          INTO reviewer_logo
          FROM auth.users u
          LEFT JOIN public.profiles p   ON p.id = u.id
          LEFT JOIN public.sellers sel  ON sel.id = u.id
          LEFT JOIN public.service_providers sp2 ON sp2.user_id = u.id
          WHERE u.id = NEW.user_id;

        IF provider_user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM provider_user_id THEN
            INSERT INTO public.notifications (user_id, type, message, link, is_read, sender_logo_url)
            VALUES (
                provider_user_id,
                'new_review',
                'قام ' || COALESCE(NEW.user_name, 'أحد المستخدمين') || ' بإضافة تقييم جديد على خدمتك "' || COALESCE(service_name_val,'') || '".',
                '/services/' || NEW.service_id::text,
                false,
                reviewer_logo
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- ================================================================
-- 6. handle_new_service_provider_review_notification
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_service_provider_review_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    provider_user_id UUID;
    reviewer_logo    TEXT;
BEGIN
    SELECT COALESCE(sp.user_id, sp.id) INTO provider_user_id
      FROM public.service_providers sp WHERE sp.id = NEW.service_provider_id;

    SELECT COALESCE(sel.logo_url, sp2.logo_url, p.avatar_url)
      INTO reviewer_logo
      FROM auth.users u
      LEFT JOIN public.profiles p   ON p.id = u.id
      LEFT JOIN public.sellers sel  ON sel.id = u.id
      LEFT JOIN public.service_providers sp2 ON sp2.user_id = u.id
      WHERE u.id = NEW.user_id;

    IF provider_user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM provider_user_id THEN
        INSERT INTO public.notifications (user_id, type, message, link, is_read, sender_logo_url)
        VALUES (
            provider_user_id,
            'new_review',
            'قام ' || COALESCE(NEW.user_name, 'أحد المستخدمين') || ' بإضافة تقييم جديد على ملفك الشخصي.',
            '/provider/' || NEW.service_provider_id::text,
            false,
            reviewer_logo
        );
    END IF;
    RETURN NEW;
END;
$$;
