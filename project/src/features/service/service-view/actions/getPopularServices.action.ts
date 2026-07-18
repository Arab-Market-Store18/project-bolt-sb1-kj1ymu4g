// src/features/service/service-view/actions/getPopularServices.action.ts

'use server';

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';

interface GetPopularServicesOptions {
  limit?: number;
  categoryId?: number;
  filter?: string;
}

export async function getPopularServices(options: GetPopularServicesOptions = {}) {
  const { limit = 12, categoryId, filter = 'all' } = options;

  try {
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('services')
      .select(`
        id,
        name,
        price,
        currency,
        images,
        likes_count,
        is_active,
        is_approved,
        created_at,
        service_providers!left (
          id, business_name, logo_url, city
        )
      `)
      .eq('is_active', true)
      .eq('is_approved', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (filter === 'top') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('❌ خطأ في getPopularServices Action:', error);
      return { success: false, message: error.message, data: [], stats: {} };
    }

    // لا يوجد عمود "rating" على جدول services — نحسب متوسط التقييم
    // من جدول service_reviews لكل خدمة في استعلام واحد مجمّع.
    const serviceIds = (data || []).map(s => s.id);
    const ratingsMap = new Map<string, { avg_rating: number; review_count: number }>();

    if (serviceIds.length > 0) {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('service_reviews')
        .select('service_id, rating')
        .in('service_id', serviceIds)
        .is('parent_review_id', null);

      if (!reviewsError && reviewsData) {
        const grouped = new Map<string, number[]>();
        for (const r of reviewsData) {
          if (!grouped.has(r.service_id)) grouped.set(r.service_id, []);
          if (r.rating) grouped.get(r.service_id)!.push(r.rating);
        }
        grouped.forEach((ratings, serviceId) => {
          const review_count = ratings.length;
          const avg_rating = review_count > 0
            ? Math.round((ratings.reduce((s, r) => s + r, 0) / review_count) * 10) / 10
            : 0;
          ratingsMap.set(serviceId, { avg_rating, review_count });
        });
      }
    }

    // تحويل شكل بيانات "services" إلى الشكل الذي يتوقعه MiniServiceCard
    // (title/base_price/provider... بدلاً من name/price/service_providers)
    const dataWithRatings = (data || []).map((s: any) => {
      const provider = Array.isArray(s.service_providers) ? s.service_providers[0] : s.service_providers;
      const rating = ratingsMap.get(s.id) ?? { avg_rating: 0, review_count: 0 };
      return {
        id: s.id,
        title: s.name,
        base_price: s.price,
        currency: s.currency,
        images: s.images,
        thumbnail_image_url: Array.isArray(s.images) ? s.images[0] : null,
        provider: provider ? {
          id: provider.id,
          business_name: provider.business_name,
          logo_url: provider.logo_url,
          location: provider.city,
        } : undefined,
        avg_rating: rating.avg_rating,
        review_count: rating.review_count,
      };
    });

    return { success: true, data: dataWithRatings, stats: { total: dataWithRatings.length } };

  } catch (err: any) {
    console.error('🔥 خطأ غير متوقع في getPopularServices Action:', err);
    return { success: false, message: err.message, data: [], stats: {} };
  }
}
