-- المشكلة: بعض الجداول (service_reviews, service_provider_reviews, service_likes)
-- كانت تربط user_id بجدول public.users القديم/المهجور، الذي لا يمتلئ تلقائياً عند
-- تسجيل أي مستخدم جديد (كان يحتوي 3 صفوف فقط من أصل 154 مستخدم حقيقي في auth.users).
-- النتيجة: أي محاولة لإضافة تقييم أو إعجاب من مستخدم حقيقي (غير موجود في users) كانت
-- تفشل بخطأ "foreign key constraint ... violates" رغم أن المستخدم مسجّل دخول بشكل صحيح.
--
-- الحل: إعادة توجيه هذه القيود لتشير مباشرة إلى auth.users(id) (المصدر الوحيد الذي
-- يحتوي كل مستخدم دون استثناء)، بما يطابق النمط المستخدم في بقية الجداول المشابهة
-- (service_chat, service_follows, product_likes, notifications, ...).

ALTER TABLE public.service_reviews DROP CONSTRAINT IF EXISTS service_reviews_user_id_fkey;
ALTER TABLE public.service_reviews ADD CONSTRAINT service_reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.service_provider_reviews DROP CONSTRAINT IF EXISTS service_provider_reviews_user_id_fkey;
ALTER TABLE public.service_provider_reviews ADD CONSTRAINT service_provider_reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.service_likes DROP CONSTRAINT IF EXISTS fk_user;
ALTER TABLE public.service_likes ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
