// src/features/service/service-view/actions/toggleLike.action.ts
"use server";

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

export async function toggleServiceLikeAction(serviceId: string): Promise<{
  success: boolean;
  liked: boolean;
  likeId?: string;
  error?: string;
}> {
  try {
    console.log("❤️ [Server Action] تبديل الإعجاب للخدمة:", serviceId);
    
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient();

    
    // التحقق من المصادقة باستخدام Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        liked: false,
        error: "يجب تسجيل الدخول للإعجاب بالخدمة"
      };
    }

    // التحقق من وجود الخدمة باستخدام Supabase
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, status')
      .eq('id', serviceId)
      .eq('status', 'ACTIVE')
      .single();

    if (serviceError || !service) {
      return {
        success: false,
        liked: false,
        error: "الخدمة غير موجودة أو غير متاحة"
      };
    }

    // البحث عن إعجاب موجود باستخدام Supabase
    const { data: existingLike, error: likeError } = await supabase
      .from('service_likes')
      .select('id')
      .eq('service_id', serviceId)
      .eq('user_id', user.id)
      .maybeSingle();

    let liked = false;
    let likeId: string | undefined;

    if (existingLike) {
      // حذف الإعجاب
      const { error: deleteError } = await supabase
        .from('service_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('خطأ في حذف الإعجاب:', deleteError);
        return {
          success: false,
          liked: false,
          error: 'حدث خطأ أثناء إلغاء الإعجاب'
        };
      }
      liked = false;
    } else {
      // إضافة إعجاب جديد
      const { data: newLike, error: insertError } = await supabase
        .from('service_likes')
        .insert({
          service_id: serviceId,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError || !newLike) {
        console.error('خطأ في إضافة الإعجاب:', insertError);
        return {
          success: false,
          liked: false,
          error: 'حدث خطأ أثناء الإعجاب'
        };
      }
      liked = true;
      likeId = newLike.id;
    }

    // تحديث عداد الإعجابات
    const { count: likesCount } = await supabase
      .from('service_likes')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId);

    await supabase
      .from('services')
      .update({ likes_count: likesCount || 0 })
      .eq('id', serviceId);

    // إعادة تحميل الصفحة
    revalidatePath(`/services/${serviceId}`);
    revalidatePath('/dashboard/likes');

    console.log("✅ [Server Action] تم تبديل الإعجاب:", liked);
    return {
      success: true,
      liked,
      likeId
    };

  } catch (error) {
    console.error("❌ [Server Action] خطأ غير متوقع:", error);
    
    return {
      success: false,
      liked: false,
      error: 'حدث خطأ غير متوقع'
    };
  }
}