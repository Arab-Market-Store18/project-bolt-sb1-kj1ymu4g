-- V2: Fix service_chat/service_message_likes RLS + FKs, add service chat notification trigger.
-- Mirrors the working product_chat setup. See .agents/memory/chat-notification-trigger-bug.md
-- for the full incident context (why these were needed).

-- 1) RLS policies for service_chat (previously RLS enabled with zero policies -> all access denied)
CREATE POLICY IF NOT EXISTS "Enable read access for all users on service_chat"
  ON public.service_chat FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users on service_chat"
  ON public.service_chat FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY IF NOT EXISTS "Enable update for message owner on service_chat"
  ON public.service_chat FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
CREATE POLICY IF NOT EXISTS "Enable delete for message owner on service_chat"
  ON public.service_chat FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- 2) RLS policies for service_message_likes (same issue)
CREATE POLICY IF NOT EXISTS "Allow read access to all users on service_message_likes"
  ON public.service_message_likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow users to insert their own likes on service_message_likes"
  ON public.service_message_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Allow users to delete their own likes on service_message_likes"
  ON public.service_message_likes FOR DELETE USING (auth.uid() = user_id);

-- 3) Fix FKs that incorrectly pointed at the legacy public.users table instead of auth.users
ALTER TABLE public.service_chat DROP CONSTRAINT IF EXISTS fk_sender;
ALTER TABLE public.service_chat ADD CONSTRAINT fk_sender
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.service_chat DROP CONSTRAINT IF EXISTS fk_receiver;
ALTER TABLE public.service_chat ADD CONSTRAINT fk_receiver
  FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.service_message_likes DROP CONSTRAINT IF EXISTS service_message_likes_user_id_fkey;
ALTER TABLE public.service_message_likes ADD CONSTRAINT service_message_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4) Fix NULL sender_name bug in the existing product_chat notification trigger
CREATE OR REPLACE FUNCTION public.handle_new_private_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    sender_name TEXT;
    notification_message TEXT;
    notification_recipient_id UUID;
    product_link TEXT;
BEGIN
    SELECT COALESCE(p.full_name, s.business_name, 'مستخدم') INTO sender_name
      FROM public.profiles p LEFT JOIN public.sellers s ON p.id = s.id WHERE p.id = NEW.sender_id;
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

-- 5) New equivalent trigger for service_chat.
-- NOTE: service_providers.id is an internal PK, NOT the auth user id -- the real auth id is
-- service_providers.user_id. Recipient/identity joins below must use user_id.
CREATE OR REPLACE FUNCTION public.handle_new_service_message_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    sender_name TEXT;
    notification_message TEXT;
    notification_recipient_id UUID;
    service_link TEXT;
BEGIN
    SELECT COALESCE(p.full_name, sp.business_name, 'مستخدم') INTO sender_name
      FROM public.profiles p LEFT JOIN public.service_providers sp ON p.id = sp.user_id WHERE p.id = NEW.sender_id;
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

DROP TRIGGER IF EXISTS on_new_service_message_trigger ON public.service_chat;
CREATE TRIGGER on_new_service_message_trigger
  AFTER INSERT ON public.service_chat
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_service_message_notification();
