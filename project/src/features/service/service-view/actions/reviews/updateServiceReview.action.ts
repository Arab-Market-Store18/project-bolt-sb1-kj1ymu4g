'use server';
// features/service/service-view/actions/reviews/updateServiceReview.action.ts

import { createSupabaseServerClient } from "@/lib/utils/supabase/server";

interface UpdateServiceReviewPayload {
  reviewId: string;
  rating?: number;
  comment?: string;
}

export async function updateServiceReview(payload: UpdateServiceReviewPayload) {
  const { reviewId, rating, comment } = payload;

  const updateData: { rating?: number; comment?: string } = {};
  if (rating !== undefined) updateData.rating = rating;
  if (comment !== undefined) updateData.comment = comment;
  if (Object.keys(updateData).length === 0) {
    return { error: { code: 'VALIDATION', message: 'No fields to update.' } };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('service_reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) return { error: { code: error.code, message: error.message } };
  return { data };
}
