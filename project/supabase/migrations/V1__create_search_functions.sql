-- supabase/migrations/V1__create_search_functions.sql

-- V1__create_search_functions.sql

-- أولاً، نتأكد من تفعيل إضافة pgvector
create extension if not exists vector;

-- ثانياً، ننشئ دالة للبحث بالتشابه الدلالي
create or replace function match_products_and_services (
  query_embedding vector(384), -- البصمة الرياضية لكلمة البحث
  match_threshold float,      -- حد التشابه (مثلاً 0.7)
  match_count int             -- عدد النتائج المطلوبة
)
returns table (
  id uuid,
  name text,
  description text,
  price numeric,
  currency text,
  image_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.name,
    p.description,
    p.price,
    p.currency,
    p.image_url,
    1 - (p.embedding <=> query_embedding) as similarity
  from products as p
  where p.embedding is not null and 1 - (p.embedding <=> query_embedding) > match_threshold
  
  -- يمكنك إضافة البحث في جدول الخدمات (services) هنا إذا كان موجوداً
  -- union all
  -- select ... from services as s ...

  order by similarity desc
  limit match_count;
end;
$$;
