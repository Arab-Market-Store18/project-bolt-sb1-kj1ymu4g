'use server';
// features/service/service-view/actions/reviews/deleteServiceReview.action.ts

import { createSupabaseServerClient } from "@/lib/utils/supabase/server";

export async function deleteServiceReview(reviewId: string): Promise<{ error?: { code?: string; message: string } }> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('service_reviews').delete().eq('id', reviewId);

  if (error) return { error: { code: error.code, message: error.message } };
  return {};
}
