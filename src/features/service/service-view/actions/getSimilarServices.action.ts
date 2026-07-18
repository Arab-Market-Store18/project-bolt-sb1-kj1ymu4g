// المسار: src/features/service/service-view/actions/getSimilarServices.action.ts
// -- النسخة المعدلة (تم إزالة التعليق من داخل الـ select) --

"use server";

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { z } from "zod";

// مخطط التحقق من المدخلات لضمان الأمان
const GetSimilarServicesSchema = z.object({
  serviceId: z.string().uuid(),
  categoryId: z.number(),
  sortBy: z.enum(['relevance', 'rating', 'price_low', 'price_high', 'delivery']).default('relevance'),
  minPrice: z.number().min(0).default(0),
  maxPrice: z.number().max(100000).default(100000),
  deliveryTime: z.number().positive().nullish(),
  onlyVerified: z.boolean().default(false),
  onlyFeatured: z.boolean().default(false),
  limit: z.number().int().positive().default(10),
});

export async function getSimilarServicesAction(input: z.infer<typeof GetSimilarServicesSchema>) {
  console.log("🚀 Server Action 'getSimilarServicesAction' has been called with input:", input);

  try {
    const validatedInput = GetSimilarServicesSchema.safeParse(input);
    if (!validatedInput.success) {
      console.error("Validation failed:", validatedInput.error.errors);
      return { success: false, error: "Invalid input.", data: null };
    }
    
    const { 
      serviceId, categoryId, sortBy, minPrice, maxPrice, 
      deliveryTime, onlyVerified, onlyFeatured, limit 
    } = validatedInput.data;

    const supabase = await createSupabaseServerClient();

    // --- بناء الاستعلام الديناميكي ---
    let query = supabase
      .from('services')
      .select(`
        id, name, price, currency, images, likes_count, rating,
        created_at, thumbnail_image_url,
        service_providers!left (id, business_name, logo_url)
      `)
      .eq('category_id', categoryId)
      .neq('id', serviceId)
      .eq('is_active', true)
      .eq('is_approved', true)
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .limit(limit);

    // إضافة الفلاتر الشرطية
    if (deliveryTime) {
      query = query.lte('delivery_time_days', deliveryTime);
    }
    if (onlyVerified) {
      query = query.eq('provider.is_verified', true);
    }
    if (onlyFeatured) {
      query = query.eq('is_featured', true);
    }

    // إضافة الترتيب الديناميكي
    switch (sortBy) {
      case 'rating':
        query = query.order('avg_rating', { referencedTable: 'service_stats', ascending: false, nullsFirst: false });
        break;
      case 'price_low':
        query = query.order('base_price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('base_price', { ascending: false });
        break;
      case 'delivery':
        query = query.order('delivery_time_days', { ascending: true, nullsFirst: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error, status, statusText } = await query;
    
    // طباعة معلومات الطلب في الطرفية (server console)
    console.log('✅ Supabase Query Executed:');
    console.log('   - Status:', status, statusText);
    console.log('   - Rows returned:', data?.length);
    if (error) {
      console.error('   - Supabase Error:', error);
    }

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data: data || [], error: null };

  } catch (err: any) {
    console.error("🔥 Critical error in getSimilarServicesAction:", err.message);
    return { success: false, error: "An unexpected server error occurred.", data: null };
  }
}