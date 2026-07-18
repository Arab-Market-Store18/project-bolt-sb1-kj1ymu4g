// features/service/profile-service/actions/profile-service.actions.ts
// -- Server Actions للملف الشخصي - النسخة النهائية بناءً على مخطط قاعدة البيانات المؤكد --

'use server';

import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { connection } from 'next/server';
import { z } from 'zod';

// =================================================================
// =================================================================
// الدالة الأولى: getCachedProvider (معدلة مع تصحيح الأخطاء)
// =================================================================
export async function getCachedProvider(providerId: string) {
  console.log('🔍 getCachedProvider received:', providerId);
  await connection();
  try {
    const supabase = await createSupabaseServerClient();
    
    // ✅ سجل الاستعلام
    console.log('📡 Executing query for provider:', providerId);
    
    const { data: provider, error } = await supabase
      .from('service_providers')
      .select(`
        id, business_name, logo_url, avatar_url, store_image_url, description, city, 
        phone_numbers, followers_count, total_likes_count, trust_features, 
        faqs, working_hours, specialization, qualifications, certifications, 
        years_of_experience, availability, working_days, emergency_service,
        country, physical_address, email, full_name, provider_type, store_type,
        rating, category_id, category, sub_category, is_setup_complete,
        created_at, updated_at
      `)
      .eq('id', providerId)
      .single();
      
    if (error) {
      console.error('❌ خطأ في جلب بيانات المقدم:', error);
      // ✅ تفاصيل الخطأ
      console.error('❌ تفاصيل الخطأ:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return { provider: null, error: error.message };
    }
    
    // ✅ تأكيد النجاح
    console.log('✅ Provider fetched successfully:', provider?.id);
    return { provider, error: null };
    
  } catch (error) {
    console.error('🔥 خطأ غير متوقع:', error);
    return { provider: null, error: 'حدث خطأ غير متوقع' };
  }
}

// =================================================================
// الدالة الثانية: toggleFollowProvider (معدلة لاستقبال بيانات جاهزة)
// =================================================================
export async function toggleFollowProvider({
  providerId,
  userId,
  isFollowing,
  followersCount
}: {
  providerId: string;
  userId: string;
  isFollowing: boolean;
  followersCount: number;
}): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; message?: string; error?: string }> {
  
  console.log('🔵 toggleFollowProvider بدأ', { providerId, userId, isFollowing, followersCount });
  await connection();
  
  try {
    const supabase = await createSupabaseServerClient();
    
    // تحقق بسيط من المصادقة (اختياري)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return { 
        success: false, 
        isFollowing, 
        followersCount, 
        error: 'يجب تسجيل الدخول لمتابعة مقدم الخدمة' 
      };
    }

    // تحقق من تطابق userId المرسل مع المستخدم الفعلي
    if (authUser.id !== userId) {
      return { 
        success: false, 
        isFollowing, 
        followersCount, 
        error: 'لا يمكنك متابعة نيابة عن مستخدم آخر' 
      };
    }

    if (!providerId) {
      return { 
        success: false, 
        isFollowing, 
        followersCount, 
        error: 'معرف المقدم مطلوب' 
      };
    }

    if (userId === providerId) {
      return { 
        success: false, 
        isFollowing, 
        followersCount, 
        error: 'لا يمكنك متابعة نفسك' 
      };
    }

    if (isFollowing) {
      // إلغاء المتابعة
      const { error } = await supabase
        .from('service_follows')
        .delete()
        .eq('service_provider_id', providerId)
        .eq('user_id', userId);

      if (error) {
        return { 
          success: false, 
          isFollowing, 
          followersCount, 
          error: 'حدث خطأ أثناء إلغاء المتابعة' 
        };
      }
    } else {
      // متابعة
      const { error } = await supabase
        .from('service_follows')
        .insert({ 
          service_provider_id: providerId, 
          user_id: userId 
        });

      if (error) {
        return { 
          success: false, 
          isFollowing, 
          followersCount, 
          error: 'حدث خطأ أثناء المتابعة' 
        };
      }
    }

    const newFollowersCount = isFollowing 
      ? Math.max(0, followersCount - 1) 
      : followersCount + 1;

    revalidatePath(`/provider/${providerId}`);

    return { 
      success: true, 
      isFollowing: !isFollowing, 
      followersCount: newFollowersCount, 
      message: isFollowing ? 'تم إلغاء المتابعة' : 'تمت المتابعة بنجاح' 
    };

  } catch (error) {
    console.error('🔥 Unexpected error in toggleFollowProvider:', error);
    return { 
      success: false, 
      isFollowing, 
      followersCount, 
      error: 'حدث خطأ غير متوقع' 
    };
  }
}

export async function addProviderReview({
  providerId,
  rating,
  comment,
  userId,
  userName,
  userAvatar,
}: {
  providerId: string;
  rating: number;
  comment: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
}) {
  console.log('📝 addProviderReview called with:', { providerId, rating, comment, userId, userName, userAvatar });

  const supabase = await createSupabaseServerClient();
  
  // 1. التحقق من المصادقة
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return { success: false, error: 'يجب تسجيل الدخول لإضافة تقييم' };
  }

  // 2. التحقق من تطابق userId المرسل مع المستخدم الفعلي
  if (authUser.id !== userId) {
    return { success: false, error: 'لا يمكنك إضافة تقييم نيابة عن مستخدم آخر' };
  }

  // ✅ هنا ضع السطر الجديد (بعد التحقق من التطابق)
  console.log('🔍 التحقق من تطابق:', {
    auth_uid: authUser.id,
    userId_sent: userId,
    match: authUser.id === userId
  });

  // 3. التحقق من صحة البيانات
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  }
  if (comment.trim().length < 10) {
    return { success: false, error: 'التعليق يجب أن لا يقل عن 10 أحرف' };
  }
  if (comment.length > 1000) {
    return { success: false, error: 'التعليق طويل جدًا' };
  }

console.log('💾 Inserting review with data:', {
  service_provider_id: providerId,
  user_id: userId,
  rating,
  comment: comment.trim(),
  user_name: userName,
  user_avatar_url: userAvatar
});

const { data: insertedReview, error: insertError } = await supabase
  .from('service_provider_reviews')
  .insert({
    service_provider_id: providerId,
    user_id: userId,
    rating,
    comment: comment.trim(),
    user_name: userName,
    user_avatar_url: userAvatar,
  })
  .select()
  .single();
  console.log('🔴 insertError object:', insertError); // لرؤية الكائن كاملاً
  if (insertError) {
    console.error("❌ addProviderReview Error - Full details:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      stack: insertError.stack
    });
    
    if (insertError.code === '23505') {
      return { success: false, error: 'لقد قمت بتقييم هذا المزود بالفعل.' };
    }
    return { success: false, error: 'حدث خطأ أثناء إضافة التقييم.' };
  }
  // 5. إعادة تحميل الصفحة (اختياري، يمكن استبداله بـ revalidateTag)
  revalidatePath(`/provider/${providerId}`);

  return { 
    success: true, 
    message: 'تم إضافة تقييمك بنجاح!',
    review: insertedReview 
  };
}
  


// =================================================================
// الدالة الرابعة: getProviderReviews (النسخة النهائية والمبسطة)
// =================================================================

export async function getProviderReviews(providerId: string, page: number = 1, limit: number = 10) {
  console.log('🔍 getProviderReviews called with:', { providerId, page, limit });
  
  try {
    const supabase = await createSupabaseServerClient();
    console.log('✅ Supabase client created');
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    console.log('📊 Range:', { from, to });

    const { data: reviews, error, count } = await supabase
      .from('service_provider_reviews')
      .select('*', { count: 'exact' })
      .eq('service_provider_id', providerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("❌ Supabase error:", error);
      return { reviews: [], total: 0, error: error.message, nextPage: undefined };
    }

    console.log('✅ Reviews fetched:', { count, reviewsCount: reviews?.length });
    return { 
      reviews: reviews || [], 
      total: count || 0, 
      nextPage: (count || 0) > to + 1 ? page + 1 : undefined,
      error: null 
    };
    
  } catch (error) {
    console.error('🔥 Unexpected error:', error);
    return { reviews: [], total: 0, error: 'حدث خطأ غير متوقع', nextPage: undefined };
  }
}



// =================================================================
// updateProviderReview: تعديل تقييم موجود على ملف مزود الخدمة
// =================================================================
export async function updateProviderReview({
  reviewId,
  userId,
  rating,
  comment,
}: {
  reviewId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; error?: string; review?: any }> {
  const supabase = await createSupabaseServerClient();

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser || authUser.id !== userId) {
    return { success: false, error: 'غير مصرح به.' };
  }

  if (rating < 1 || rating > 5) return { success: false, error: 'التقييم يجب أن يكون بين 1 و 5' };
  if (comment.trim().length < 10) return { success: false, error: 'التعليق يجب أن لا يقل عن 10 أحرف' };

  const { data, error } = await supabase
    .from('service_provider_reviews')
    .update({ rating, comment: comment.trim() })
    .eq('id', reviewId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return { success: false, error: 'حدث خطأ أثناء التعديل.' };

  revalidatePath(`/provider/`);
  return { success: true, review: data };
}

// =================================================================
// الدالة الخامسة: getFollowStatus (معدلة لاستقبال userId)
// =================================================================
export async function getFollowStatus(
  providerId: string, 
  userId?: string
): Promise<{ isFollowing: boolean }> {
  
  await connection();
  
  // إذا لم يتم تمرير userId، فالمستخدم ليس متابعاً
  if (!userId) {
    return { isFollowing: false };
  }

  try {
    const supabase = await createSupabaseServerClient();
    
    const { data } = await supabase
      .from('service_follows')
      .select('id')
      .eq('service_provider_id', providerId)
      .eq('user_id', userId)
      .maybeSingle();

    return { isFollowing: !!data };

  } catch (error) {
    console.error('🔥 Error in getFollowStatus:', error);
    return { isFollowing: false };
  }
}
// =================================================================
// الدالة السادسة: deleteReviewAction (معدلة لاستقبال userId)
// =================================================================
export async function deleteReviewAction(
  reviewId: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> {
  
  const supabase = await createSupabaseServerClient();
  
  // تحقق من المصادقة
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return { success: false, error: 'غير مصرح به.' };
  }

  // تحقق من تطابق userId المرسل مع المستخدم الفعلي
  if (authUser.id !== userId) {
    return { success: false, error: 'لا يمكنك حذف تقييم نيابة عن مستخدم آخر' };
  }

  // جلب التقييم للتأكد من ملكيته
  const { data: review, error: fetchError } = await supabase
    .from('service_provider_reviews')
    .select('id, user_id, service_provider_id')
    .eq('id', reviewId)
    .single();

  if (fetchError || !review) {
    return { success: false, error: 'لم يتم العثور على التقييم.' };
  }

  // التحقق من أن المستخدم هو صاحب التقييم
  if (review.user_id !== userId) {
    return { success: false, error: 'ليس لديك صلاحية لحذف هذا التقييم.' };
  }

  // حذف التقييم
  const { error: deleteError } = await supabase
    .from('service_provider_reviews')
    .delete()
    .eq('id', review.id);

  if (deleteError) {
    return { success: false, error: 'حدث خطأ أثناء الحذف.' };
  }

  revalidatePath(`/provider/${review.service_provider_id}`);
  return { success: true };
}