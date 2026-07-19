// src/features/service/service-view/actions/toggleSave.action.ts
"use server";

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';

export async function toggleServiceSaveAction(serviceId: string): Promise<{
  success: boolean;
  saved: boolean;
  error?: string;
}> {
  try {
    console.log('💾 [Server Action] تبديل الحفظ:', serviceId);

    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient();

    
    // التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        saved: false,
        error: 'يجب تسجيل الدخول لحفظ الخدمة'
      };
    }

    // التحقق من وجود الخدمة
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, status')
      .eq('id', serviceId)
      .eq('status', 'ACTIVE')
      .single();

    if (serviceError || !service) {
      return {
        success: false,
        saved: false,
        error: 'الخدمة غير موجودة أو غير متاحة'
      };
    }

    // التحقق من الحفظ الموجود
    const { data: existingSave, error: saveError } = await supabase
      .from('service_bookmarks')
      .select('id')
      .eq('service_id', serviceId)
      .eq('user_id', user.id)
      .maybeSingle();

    let saved = false;

    if (existingSave) {
      // حذف الحفظ
      const { error: deleteError } = await supabase
        .from('service_bookmarks')
        .delete()
        .eq('id', existingSave.id);

      if (deleteError) {
        console.error('خطأ في حذف الحفظ:', deleteError);
        return {
          success: false,
          saved: false,
          error: 'حدث خطأ أثناء إلغاء الحفظ'
        };
      }
      saved = false;
    } else {
      // إضافة حفظ جديد
      const { error: insertError } = await supabase
        .from('service_bookmarks')
        .insert({
          service_id: serviceId,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('خطأ في إضافة الحفظ:', insertError);
        return {
          success: false,
          saved: false,
          error: 'حدث خطأ أثناء الحفظ'
        };
      }
      saved = true;
    }

    // إعادة تحميل الصفحة
    revalidatePath(`/services/${serviceId}`);
    revalidatePath('/dashboard/saved');

    console.log('✅ [Server Action] تم تبديل الحفظ:', saved);
    return {
      success: true,
      saved
    };

  } catch (error) {
    console.error('❌ [Server Action] خطأ غير متوقع:', error);
    return {
      success: false,
      saved: false,
      error: 'حدث خطأ غير متوقع'
    };
  }
}