// src/features/service/service-view/actions/fetchService.action.ts
'use server';

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';

export async function getCachedService(serviceId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // ================================================
    // الجلب الأول: جلب بيانات الخدمة
    // ================================================
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        price,
        currency,
        images,
        video_url,
        main_category_id,
        category_id,
        discount_price,
        likes_count,
        additional_details,
        additional_prices,
        created_at,
        is_active,
        is_approved,
        service_provider_id
      `)
      .eq('id', serviceId)
      .single();

    // التحقق من نجاح الجلب الأول
    if (serviceError || !service) {
      console.error('❌ فشل جلب الخدمة:', serviceError);
      return { 
        service: null, 
        error: serviceError?.message || 'الخدمة غير موجودة' 
      };
    }

    // ================================================
    // الجلب الثاني: جلب بيانات مزود الخدمة (للبانر)
    // ================================================
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select(`
        id,
        user_id,
        business_name,
        logo_url,
        avatar_url,
        store_image_url,
        phone_numbers,
        city,
        specialization,
        qualifications,
        certifications,
        years_of_experience,
        availability,
        working_days,
        emergency_service,
        description,
        followers_count,
        total_likes_count,
        trust_features,
        faqs,
        working_hours,
        created_at,
        updated_at
      `)
      .eq('id', service.service_provider_id)
      .single();

    // تسجيل نتيجة جلب مزود الخدمة
    if (providerError) {
      console.error('⚠️ فشل جلب بيانات مزود الخدمة:', {
        providerId: service.service_provider_id,
        error: providerError.message
      });
    } else {
      console.log('✅ تم جلب مزود الخدمة بنجاح:', {
        providerId: provider.id,
        businessName: provider.business_name,
        hasAvatar: !!provider.avatar_url,
        hasStoreImage: !!provider.store_image_url
      });
    }

    // ================================================
    // دمج البيانات في كائن واحد
    // ================================================
    const completeService = {
      ...service,
      // البيانات الجاهزة لـ ServiceHeader والبانر
      service_providers: provider || null,
      provider: provider || null, // للتوافق مع الكود القديم
      
      // إحصائيات إضافية
      stats: {
        like_count: service.likes_count || 0,
        review_count: 0, // سيتم جلبها من جلب منفصل
        avg_rating: 0    // سيتم جلبها من جلب منفصل
      },
      
      // تفاعلات المستخدم (سواء كان مسجل دخول أم لا)
      user_interaction: {
        has_liked: false,
        has_saved: false,
        has_followed: false
      }
    };

    // تسجيل نجاح العملية كاملة
    console.log('🎉 تم تجهيز بيانات صفحة الخدمة بالكامل:', {
      serviceId: completeService.id,
      serviceName: completeService.name,
      providerName: provider?.business_name || 'غير موجود',
      hasImages: !!(completeService.images && completeService.images.length > 0)
    });

    return { 
      service: completeService, 
      error: null 
    };

  } catch (error) {
    // خطأ غير متوقع
    console.error('🔥 خطأ غير متوقع في getCachedService:', error);
    return { 
      service: null, 
      error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' 
    };
  }
}

// ================================================
// جلب منفصل للتقييمات (مع احتساب المتوسط والعدد)
// ================================================
export async function getServiceReviews(serviceId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // بعد migration V4 أضفنا user_name / user_avatar_url / parent_review_id مباشرةً
    // لذا لا حاجة للـ join مع profiles بعد الآن (نحتفظ به كاحتياط للسجلات القديمة).
    const { data: reviews, error } = await supabase
      .from('service_reviews')
      .select('id, service_id, user_id, rating, comment, created_at, user_name, user_avatar_url, parent_review_id')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ فشل جلب التقييمات:', error);
      return { reviews: [], avg_rating: 0, review_count: 0, error: error.message };
    }

    // للسجلات القديمة التي لا تحتوي على user_name — نجلب الملف الشخصي كاحتياط
    const missingNameIds = (reviews || [])
      .filter(r => !r.user_name && r.user_id)
      .map(r => r.user_id);
    let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
    if (missingNameIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(new Set(missingNameIds)));
      profilesMap = new Map((profiles || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]));
    }

    // بناء الردود على التقييمات
    const topLevelMap = new Map<string, any>();
    const enrichedReviews = (reviews || []).map(r => {
      const fallback = profilesMap.get(r.user_id);
      return {
        ...r,
        parent_review_id: r.parent_review_id ?? null,
        user_name: r.user_name || fallback?.full_name || 'مستخدم',
        user_avatar_url: r.user_avatar_url || fallback?.avatar_url || null,
        replies: [] as any[],
      };
    });

    // ربط الردود بالتقييمات الأصلية
    const topLevel: typeof enrichedReviews = [];
    enrichedReviews.forEach(r => {
      if (!r.parent_review_id) {
        topLevelMap.set(r.id, r);
        topLevel.push(r);
      }
    });
    enrichedReviews.forEach(r => {
      if (r.parent_review_id) {
        const parent = topLevelMap.get(r.parent_review_id);
        if (parent) parent.replies.push(r);
      }
    });

    // حساب المتوسط والعدد من التقييمات الأصلية فقط
    const originalRatings = topLevel.map(r => r.rating).filter(Boolean) as number[];
    const review_count = originalRatings.length;
    const avg_rating = review_count > 0
      ? Math.round((originalRatings.reduce((s, r) => s + r, 0) / review_count) * 10) / 10
      : 0;

    console.log(`✅ تم جلب ${enrichedReviews.length} تقييم للخدمة (متوسط: ${avg_rating}, عدد: ${review_count})`);

    return { reviews: topLevel, avg_rating, review_count, error: null };

  } catch (error) {
    console.error('🔥 خطأ غير متوقع في getServiceReviews:', error);
    return { reviews: [], avg_rating: 0, review_count: 0, error: 'حدث خطأ غير متوقع' };
  }
}

// ================================================
// جلب منفصل للخدمات المشابهة (مبسط بدون علاقات معقدة)
// ================================================
export async function getSimilarServices(categoryId: number, currentServiceId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. جلب الخدمات المشابهة
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id,
        name,
        price,
        images,
        service_provider_id
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .eq('is_approved', true)
      .neq('id', currentServiceId)
      .limit(6);

    if (servicesError) {
      console.error('❌ فشل جلب الخدمات المشابهة:', servicesError);
      return { services: [], error: servicesError.message };
    }

    // 2. جلب بيانات مقدمي الخدمة لكل خدمة (إذا وجدت خدمات)
    if (services && services.length > 0) {
      const providerIds = services.map(s => s.service_provider_id).filter(Boolean);
      
      const { data: providers, error: providersError } = await supabase
        .from('service_providers')
        .select(`
          id,
          business_name,
          logo_url,
          avatar_url
        `)
        .in('id', providerIds);

      if (!providersError && providers) {
        // 3. دمج البيانات
        const servicesWithProviders = services.map(service => ({
          ...service,
          provider: providers.find(p => p.id === service.service_provider_id) || null
        }));
        
        return { services: servicesWithProviders, error: null };
      }
    }

    return { services: services || [], error: null };

  } catch (error) {
    console.error('🔥 خطأ غير متوقع في getSimilarServices:', error);
    return { services: [], error: 'حدث خطأ غير متوقع' };
  }
}