// features/merchant/product-view/types/review.types.ts
// features/merchant/product-view/types/review.types.ts

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
  
