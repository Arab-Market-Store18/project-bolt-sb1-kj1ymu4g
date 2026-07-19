// المسار: features/service/service-view/types/review.types.ts
// -- ملف جديد حسب الهيكل المنظم --


import { User } from "@supabase/supabase-js";

export interface Review {
  id: string;
  rating: number | null;
  comment: string;
  user_name: string;
  user_avatar_url?: string;
  created_at: string;
  user_id: string;
  parent_review_id: string | null;
}

export interface ReviewWithReplies extends Review {
  replies: Review[];
}
