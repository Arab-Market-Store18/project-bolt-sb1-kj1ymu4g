-- =============================================================
-- V4 — Fix Ratings System
-- تاريخ: 2026-07-11
-- الوصف: إصلاح شامل لنظام التقييمات عبر كافة الجداول
-- =============================================================

-- 1. إصلاح trigger إشعارات product_reviews
--    (كان يقرأ NEW.seller_id الذي لا يوجد في الجدول)
CREATE OR REPLACE FUNCTION handle_new_product_review_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    product_name TEXT;
    seller_id_val UUID;
BEGIN
    IF NEW.parent_review_id IS NULL THEN
        SELECT p.name, p.seller_id INTO product_name, seller_id_val
        FROM public.products p WHERE p.id = NEW.product_id;
        IF seller_id_val IS NOT NULL AND NEW.user_id IS DISTINCT FROM seller_id_val THEN
            INSERT INTO public.notifications (user_id, type, message, link)
            VALUES (seller_id_val, 'new_review',
              'تقييم جديد من "' || COALESCE(NEW.user_name, 'مستخدم') || '" على منتجك "' || COALESCE(product_name,'') || '".',
              '/products/' || NEW.product_id::text);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 2. إضافة الأعمدة المفقودة في service_reviews
ALTER TABLE public.service_reviews
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS user_avatar_url text,
  ADD COLUMN IF NOT EXISTS parent_review_id uuid REFERENCES public.service_reviews(id) ON DELETE CASCADE;

-- 3. UNIQUE constraint على service_reviews(service_id, user_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_service_review'
  ) THEN
    ALTER TABLE public.service_reviews
      ADD CONSTRAINT unique_user_service_review UNIQUE (service_id, user_id);
  END IF;
END $$;

-- 4. trigger إشعارات service_reviews
CREATE OR REPLACE FUNCTION handle_new_service_review_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  service_name_val TEXT;
  provider_user_id UUID;
BEGIN
  IF NEW.parent_review_id IS NULL THEN
    SELECT s.name, COALESCE(sp.user_id, sp.id)
    INTO service_name_val, provider_user_id
    FROM public.services s
    JOIN public.service_providers sp ON sp.id = s.service_provider_id
    WHERE s.id = NEW.service_id;
    IF provider_user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM provider_user_id THEN
      INSERT INTO public.notifications(user_id, type, message, link, is_read)
      VALUES (
        provider_user_id, 'new_review',
        'قام ' || COALESCE(NEW.user_name, 'أحد المستخدمين') || ' بإضافة تقييم جديد على خدمتك "' || COALESCE(service_name_val,'') || '".',
        '/services/' || NEW.service_id::text, false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_new_service_review_notification ON public.service_reviews;
CREATE TRIGGER on_new_service_review_notification
  AFTER INSERT ON public.service_reviews
  FOR EACH ROW EXECUTE FUNCTION handle_new_service_review_notification();

-- 5. trigger تحديث service_providers.rating من service_reviews
CREATE OR REPLACE FUNCTION update_service_provider_rating_from_service_reviews()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_service_id UUID;
  p_id UUID;
BEGIN
  target_service_id := COALESCE(NEW.service_id, OLD.service_id);
  SELECT service_provider_id INTO p_id FROM public.services WHERE id = target_service_id;
  IF p_id IS NOT NULL THEN
    UPDATE public.service_providers
    SET rating = (
      SELECT ROUND(AVG(sr.rating::float)::numeric, 2)
      FROM public.service_reviews sr
      JOIN public.services s ON s.id = sr.service_id
      WHERE s.service_provider_id = p_id AND sr.parent_review_id IS NULL
    )
    WHERE id = p_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS trg_update_service_provider_rating ON public.service_reviews;
CREATE TRIGGER trg_update_service_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.service_reviews
  FOR EACH ROW EXECUTE FUNCTION update_service_provider_rating_from_service_reviews();

-- 6. trigger إشعارات service_provider_reviews
CREATE OR REPLACE FUNCTION handle_new_service_provider_review_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  provider_user_id UUID;
BEGIN
  SELECT COALESCE(sp.user_id, sp.id) INTO provider_user_id
  FROM public.service_providers sp WHERE sp.id = NEW.service_provider_id;
  IF provider_user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM provider_user_id THEN
    INSERT INTO public.notifications(user_id, type, message, link, is_read)
    VALUES (
      provider_user_id, 'new_review',
      'قام ' || COALESCE(NEW.user_name, 'أحد المستخدمين') || ' بإضافة تقييم جديد على ملفك الشخصي.',
      '/provider/' || NEW.service_provider_id::text, false
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_new_service_provider_review_notification ON public.service_provider_reviews;
CREATE TRIGGER on_new_service_provider_review_notification
  AFTER INSERT ON public.service_provider_reviews
  FOR EACH ROW EXECUTE FUNCTION handle_new_service_provider_review_notification();

-- 7. تحديث service_provider_reviews_count ليشمل تحديث rating أيضاً
CREATE OR REPLACE FUNCTION update_service_provider_reviews_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.service_providers
        SET reviews_count = (SELECT COUNT(*) FROM public.service_provider_reviews WHERE service_provider_id = NEW.service_provider_id),
            rating = (SELECT ROUND(AVG(rating::float)::numeric, 2) FROM public.service_provider_reviews WHERE service_provider_id = NEW.service_provider_id)
        WHERE id = NEW.service_provider_id;
    END IF;
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        UPDATE public.service_providers
        SET reviews_count = (SELECT COUNT(*) FROM public.service_provider_reviews WHERE service_provider_id = OLD.service_provider_id),
            rating = (SELECT ROUND(AVG(rating::float)::numeric, 2) FROM public.service_provider_reviews WHERE service_provider_id = OLD.service_provider_id)
        WHERE id = OLD.service_provider_id;
    END IF;
    RETURN NULL;
END;
$$;

-- 8. trigger تحديث sellers.rating من seller_reviews
CREATE OR REPLACE FUNCTION update_seller_rating_from_reviews()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  s_id UUID;
BEGIN
  s_id := COALESCE(NEW.seller_id, OLD.seller_id);
  IF s_id IS NOT NULL THEN
    UPDATE public.sellers
    SET rating = (
      SELECT ROUND(AVG(rating::float)::numeric, 2)
      FROM public.seller_reviews WHERE seller_id = s_id
    )
    WHERE id = s_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS trg_update_seller_rating ON public.seller_reviews;
CREATE TRIGGER trg_update_seller_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.seller_reviews
  FOR EACH ROW EXECUTE FUNCTION update_seller_rating_from_reviews();

-- 9. RLS policies لـ service_reviews
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_reviews' AND policyname='Authenticated users can insert reviews') THEN
    CREATE POLICY "Authenticated users can insert reviews" ON public.service_reviews
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_reviews' AND policyname='Users can update own reviews') THEN
    CREATE POLICY "Users can update own reviews" ON public.service_reviews
      FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='service_reviews' AND policyname='Users can delete own reviews') THEN
    CREATE POLICY "Users can delete own reviews" ON public.service_reviews
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
