"use client";

import { Star, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ProviderReview } from '../types/profile-service.types';

// ----- تنسيق التاريخ -----
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', { 
    hour: 'numeric', minute: 'numeric', year: 'numeric', month: 'short', day: 'numeric' 
  }).format(date);
};

// ----- واجهة الخصائص (Props) للمكون -----
interface ProfileServiceReviewsListProps {
  reviews: ProviderReview[]; // <-- المصدر الوحيد للبيانات
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

// ----- مكون عرض التقييمات (النسخة المصححة) -----
export const ProfileServiceReviewsList = ({
  reviews,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: ProfileServiceReviewsListProps) => {

  // تم حذف منطق جلب البيانات من هنا بالكامل

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-muted rounded-lg">
        <p className="text-muted-foreground">لا توجد تقييمات لعرضها حتى الآن.</p>
        <p className="text-sm text-muted-foreground mt-2">كن أول من يضيف تقييماً!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div 
          key={review.id} 
          className={`bg-card shadow-sm rounded-xl p-5 transition-all duration-300 ${review.isOptimistic ? 'opacity-60' : 'opacity-100'}`}
        >
          <div className="flex gap-4">
            {/* صورة المقيّم */}
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={review.user_avatar_url || undefined} alt={review.user_name || 'مستخدم'} />
              <AvatarFallback>{(review.user_name || 'م').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            {/* محتوى التقييم */} 
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <h4 className="font-semibold text-base text-card-foreground">{review.user_name || 'مستخدم'}</h4>
                <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
              </div>

              {/* عرض النجوم */} 
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-5 w-5 transition-colors ${review.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{review.rating} من 5</span>
              </div>

              {/* التعليق */}
              {review.comment && (
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* زر تحميل المزيد */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التحميل...
              </>
            ) : 'تحميل المزيد من التقييمات'}
          </Button>
        </div>
      )}
    </div>
  );
};