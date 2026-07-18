// features/merchant/product-view/hooks/useProductReviews.ts
/**
 * الوظيفة: هذا الهوك المخصص (Custom Hook) يقوم بمعالجة وتنظيم بيانات التقييمات.
 * وظيفته الأساسية هي أخذ قائمة التقييمات الأولية وربط الردود بالتقييمات الأصلية الخاصة بها،
 * ثم ترتيبها حسب التاريخ. هذا يبسط منطق العرض في مكون التقييمات.
 */

import { useMemo } from "react";
import { Review, ReviewWithReplies } from "../types/review.types";

export function useProductReviews(reviews: Review[] | undefined): ReviewWithReplies[] {
  const reviewsWithReplies = useMemo((): ReviewWithReplies[] => {
    if (!reviews) return [];

    const originalReviews = reviews.filter(r => r.parent_review_id === null);
    const repliesMap = reviews
      .filter(r => r.parent_review_id !== null)
      .reduce((acc, reply) => {
        const parentId = reply.parent_review_id!;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(reply);
        return acc;
      }, {} as Record<string, Review[]>);

    return originalReviews
      .map(review => ({
        ...review,
        replies: repliesMap[review.id] || []
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews]);

  return reviewsWithReplies;
}
