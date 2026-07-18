// المسار: features/service/service-view/actions/toggleFollow.action.ts
// -- Server Action لمتابعة/إلغاء متابعة الموفر --

'use server';

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function toggleServiceFollow(providerId: string): Promise<{
  success: boolean;
  following: boolean;
  error?: string;
}> {
  try {
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient();

    
    console.log('👥 [Server Action] تبديل المتابعة:', providerId);

    // التحقق من المصادقة
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        following: false,
        error: 'يجب تسجيل الدخول لمتابعة الموفر'
      };
    }

    // التحقق من وجود الموفر
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id, status')
      .eq('id', providerId)
      .eq('status', 'ACTIVE')
      .single();

    if (providerError || !provider) {
      return {
        success: false,
        following: false,
        error: 'الموفر غير موجود أو غير متاح'
      };
    }

    // التحقق من أن المستخدم لا يتابع نفسه
    if (providerId === user.id) {
      return {
        success: false,
        following: false,
        error: 'لا يمكنك متابعة نفسك'
      };
    }

    // التحقق من المتابعة الموجود
    const { data: existingFollow, error: followError } = await supabase
      .from('service_follows')
      .select('id')
      .eq('provider_id', providerId)
      .eq('user_id', user.id)
      .maybeSingle();

    let following = false;

    if (existingFollow) {
      // إلغاء المتابعة
      const { error: deleteError } = await supabase
        .from('service_follows')
        .delete()
        .eq('id', existingFollow.id);

      if (deleteError) {
        console.error('خطأ في إلغاء المتابعة:', deleteError);
        return {
          success: false,
          following: false,
          error: 'حدث خطأ أثناء إلغاء المتابعة'
        };
      }

      following = false;
    } else {
      // إضافة متابعة جديدة
      const { error: insertError } = await supabase
        .from('service_follows')
        .insert({
          provider_id: providerId,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('خطأ في إضافة المتابعة:', insertError);
        return {
          success: false,
          following: false,
          error: 'حدث خطأ أثناء المتابعة'
        };
      }

      following = true;
    }

    // تحديث عداد المتابعين
    const { count: followersCount } = await supabase
      .from('service_follows')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', providerId);

    await supabase
      .from('service_providers')
      .update({ followers_count: followersCount || 0 })
      .eq('id', providerId);

    // إعادة تحميل الصفحة
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/dashboard/following');

    console.log('✅ [Server Action] تم تبديل المتابعة:', following);
    return {
      success: true,
      following
    };

  } catch (error) {
    console.error('❌ [Server Action] خطأ غير متوقع:', error);
    return {
      success: false,
      following: false,
      error: 'حدث خطأ غير متوقع'
    };
  }
}