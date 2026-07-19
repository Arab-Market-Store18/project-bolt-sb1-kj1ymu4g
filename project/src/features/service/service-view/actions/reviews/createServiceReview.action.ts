'use server';
// features/service/service-view/actions/reviews/createServiceReview.action.ts

import { createSupabaseServerClient } from "@/lib/utils/supabase/server";

interface CreateServiceReviewPayload {
  serviceId: string;
  userId: string;
  providerAuthId: string;
  rating: number;
  comment: string;
  userName?: string;
  userAvatarUrl?: string | null;
}

export async function createServiceReview(payload: CreateServiceReviewPayload) {
  const { serviceId, userId, providerAuthId, rating, comment, userName, userAvatarUrl } = payload;

  if (rating === 0) return { error: { code: 'VALIDATION', message: 'Rating is required.' } };
  if (!comment.trim()) return { error: { code: 'VALIDATION', message: 'Comment is required.' } };
  if (userId === providerAuthId) return { error: { code: 'OWN_SERVICE', message: 'Cannot review own service.' } };

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('service_reviews').insert({
    service_id: serviceId,
    user_id: userId,
    rating,
    comment,
    user_name: userName || 'مستخدم',
    user_avatar_url: userAvatarUrl ?? null,
  });

  if (error) return { error: { code: error.code, message: error.message } };
  return { data };
}
