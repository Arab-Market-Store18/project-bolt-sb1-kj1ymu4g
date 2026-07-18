// src/features/service/service-view/actions/getRelatedServices.action.ts

'use server';

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';

export async function getRelatedServicesAction(input: {
  providerId: string;
  currentServiceId: string;
  limit?: number;
}) {
  const { providerId, currentServiceId, limit = 8 } = input;
  
  try {
    // 🔍 1. تحقق من بيانات الإدخال
    console.log('🔍 [DEBUG] المدخلات:', {
      providerId,
      currentServiceId,
      limit,
      providerIdType: typeof providerId,
      currentServiceIdType: typeof currentServiceId,
      providerIdLength: providerId?.length,
      currentServiceIdLength: currentServiceId?.length
    });

    const supabase = await createSupabaseServerClient();
    
    // 🔍 2. استعلام بسيط للتأكد
    const testQuery = await supabase
      .from('services')
      .select('id, name, service_provider_id, is_active, is_approved')
      .eq('service_provider_id', providerId)
      .limit(3);
      
    console.log('🔍 [DEBUG] استعلام اختبار:', {
      data: testQuery.data,
      error: testQuery.error,
      count: testQuery.data?.length || 0
    });
    
    // استعلام لجلب خدمات نفس المزود (باستثناء الخدمة الحالية)
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        price,
        secondary_price,
        discount_price,
        currency,
        thumbnail_image_url,
        images,
        likes_count,
        sales_count,
        created_at,
        category_id,
        main_category_id,
        is_best_seller,
        service_provider_id,
        service_providers!inner (
          id,
          business_name,
          logo_url
        )
      `)
      .eq('service_provider_id', providerId)
      .neq('id', currentServiceId)
      .eq('is_active', true)
      .eq('is_approved', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    // 🔍 3. تحقق من خطأ Supabase بالتفصيل
    if (error) {
      console.error('❌ [DEBUG] خطأ Supabase بالتفصيل:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      
      return {
        success: false,
        error: 'فشل في تحميل الخدمات: ' + error.message,
        data: []
      };
    }

    // 🔍 4. تحقق من البيانات المستلمة
    console.log('🔍 [DEBUG] البيانات المستلمة:', {
      servicesCount: services?.length || 0,
      services: services?.map(s => ({ 
        id: s.id, 
        name: s.name, 
        service_provider_id: s.service_provider_id,
        hasServiceProviders: !!s.service_providers
      })),
      currentServiceId,
      providerId
    });

    // جلب إحصائيات إضافية
    const { count: totalAvailable } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('service_provider_id', providerId)
      .eq('is_active', true)
      .eq('is_approved', true);

    const servicesWithImages = services?.filter(
      service => service.images && service.images.length > 0
    ).length || 0;

    const featuredServices = services?.filter(
      service => service.is_best_seller
    ).length || 0;

    // 🔍 5. النتيجة النهائية
    console.log('✅ [DEBUG] نتيجة الـ Action:', {
      success: true,
      dataLength: services?.length || 0,
      services: services?.slice(0, 3), // عرض أول 3 خدمات فقط
      stats: { 
        totalAvailable, 
        withImages: servicesWithImages, 
        featuredCount: featuredServices 
      },
      message: services && services.length > 0 
        ? `تم العثور على ${services.length} خدمة أخرى من هذا المزود`
        : 'لا توجد خدمات أخرى حالياً'
    });

    if (!services || services.length === 0) {
      return {
        success: true,
        data: [],
        stats: {
          totalAvailable: totalAvailable || 0,
          withImages: 0,
          sameCategory: 0,
          featuredCount: 0,
          avgRating: 0
        },
        message: 'لا توجد خدمات أخرى حالياً'
      };
    }

    return {
      success: true,
      data: services.map(service => ({
        id: service.id,
        title: service.name,
        name: service.name,
        description: service.description,
        price: service.price,
        base_price: service.price,
        currency: service.currency,
        discounted_price: service.discount_price,
        thumbnail_image_url: service.thumbnail_image_url,
        images: service.images,
        likes_count: service.likes_count,
        completed_orders: service.sales_count,
        created_at: service.created_at,
        category_id: service.category_id,
        is_featured: service.is_best_seller,
        provider: service.service_providers
      })),
      stats: {
        totalAvailable: totalAvailable || 0,
        withImages: servicesWithImages,
        sameCategory: 0,
        featuredCount: featuredServices,
        avgRating: 0
      },
      message: `تم العثور على ${services.length} خدمة أخرى من هذا المزود`
    };

  } catch (error: any) {
    console.error('❌ [DEBUG] خطأ غير متوقع:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    
    return {
      success: false,
      error: 'حدث خطأ غير متوقع في الخادم: ' + error.message,
      data: []
    };
  }
}