'use server';
// features/merchant/product-view/actions/reviews/deleteReview.action.ts

import { createSupabaseServerClient } from "@/lib/utils/supabase/server";

export async function deleteReview(reviewId: string): Promise<{ error?: { code?: string; message: string } }> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId);

  if (error) return { error: { code: error.code, message: error.message } };
  return {};
}
