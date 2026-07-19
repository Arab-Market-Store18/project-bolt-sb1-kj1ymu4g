// المسار: features/merchant/profile-merchant/components/sections/ProfileMerchantReviewsList.tsx


import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, ChevronDown } from "lucide-react";
import { formatDate } from '../../utils/formatters';

export const ProfileMerchantReviewsList = ({ reviews, sellerId }: { reviews: any[], sellerId: string }) => {
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const toggleReviewExpand = (reviewId: string) => {
    setExpandedReviewId(expandedReviewId === reviewId ? null : reviewId);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-muted rounded-lg">
        <p className="text-muted-foreground">لا توجد تقييمات حتى الآن. كن أول من يقيّم هذا المتجر!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-muted p-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={review.user_avatar_url || undefined} />
                <AvatarFallback>
                  {review.user_name?.charAt(0) || review.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {review.user_name || review.profiles?.full_name || 'User'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleReviewExpand(review.id)}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedReviewId === review.id ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {expandedReviewId === review.id && review.comment && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          )}
          
          {review.comment && review.comment.length > 100 && (
            <div className="mt-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => toggleReviewExpand(review.id)}
                className="h-auto p-0 text-xs"
              >
                {expandedReviewId === review.id ? 'Show less' : 'Show more'}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};