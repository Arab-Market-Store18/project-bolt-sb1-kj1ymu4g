export async function submitSellerReview(
  sellerId: string, 
  review: { rating: number; comment: string }
): Promise<SellerReview> {
  try {
    const supabase = createSupabaseBrowserClient();
    
    // 1. محاولة إرسال التقييم
    const { data, error } = await supabase
      .from('seller_reviews')
      .insert({
        seller_id: sellerId,
        rating: review.rating,
        comment: review.comment
      })
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      // 2. تحويل خطأ Supabase إلى رسالة مفهومة
      let errorMessage = "حدث خطأ في إرسال التقييم";
      
      if (error.code === '23505') { // unique violation
        errorMessage = "لقد قمت بتقييم هذا المتجر سابقاً";
      } else if (error.code === '42501') { // permission denied
        errorMessage = "يجب تسجيل الدخول أولاً";
      } else if (error.message.includes("cannot review their own")) {
        errorMessage = "لا يمكنك تقييم متجرك الخاص";
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error("لم يتم إنشاء التقييم");
    }

    // 3. تحويل البيانات إلى الشكل المطلوب
    return {
      id: data.id,
      created_at: data.created_at,
      rating: data.rating,
      comment: data.comment,
      user_id: data.user_id,
      user_name: data.profiles?.full_name || "مستخدم",
      user_avatar_url: data.profiles?.avatar_url || null,
      profiles: data.profiles
    } as SellerReview;
    
  } catch (error) {
    // 4. التأكد من أن الخطأ يحتوي على رسالة
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("حدث خطأ غير معروف");
    }
  }
}