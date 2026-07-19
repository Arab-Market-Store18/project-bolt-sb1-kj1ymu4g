'use server';
// features/merchant/product-view/actions/reviews/createReview.action.ts

import { createSupabaseServerClient } from "@/lib/utils/supabase/server";

interface CreateReviewPayload {
  productId: string;
  userId: string;
  sellerId: string;
  rating: number;
  comment: string;
  userName?: string;
  userAvatar?: string | null;
}

export async function createReview(payload: CreateReviewPayload) {
  const { productId, userId, sellerId, rating, comment, userName, userAvatar } = payload;

  if (rating === 0) return { error: { code: 'VALIDATION', message: 'Rating is required.' } };
  if (!comment.trim()) return { error: { code: 'VALIDATION', message: 'Comment is required.' } };
  if (userId === sellerId) return { error: { code: 'OWN_PRODUCT', message: 'Cannot review own product.' } };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    user_id: userId,
    rating,
    comment,
    user_name: userName || 'مستخدم',
    user_avatar_url: userAvatar ?? null,
  });

  if (error) return { error: { code: error.code, message: error.message } };
  return { data };
}
