// src/features/service/profile-service/components/AddReviewForm.tsx
"use client";

import React, { useState } from 'react';
import { Star, Loader2, Check, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useModal } from '@/hooks/use-modal';
import { useAuth } from '@/context/AuthContext';
import { addProviderReview } from '../actions/profile-service.actions';
import { updateProviderReview } from '../actions/profile-service.actions';

interface ExistingReview {
  id: string;
  rating: number;
  comment: string;
}

interface AddReviewFormProps {
  providerId: string;
  existingReview?: ExistingReview | null;
  onReviewAdded: (review: any, action?: 'remove' | 'success') => void;
}

export function AddReviewForm({ providerId, existingReview, onReviewAdded }: AddReviewFormProps) {
  const { toast } = useToast();
  const { onOpen } = useModal();
  const { user, displayName, avatarUrl, isLoading: authLoading } = useAuth();

  // إذا كان هناك تقييم سابق → ابدأ في وضع التعديل
  const [isEditMode, setIsEditMode] = useState(!!existingReview);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) { onOpen('emailSignUp'); return; }
    if (rating === 0) return toast({ title: "اختر تقييم النجوم أولاً", variant: "destructive" });
    if (comment.trim().length < 10) return toast({ title: "التعليق يجب أن يكون 10 أحرف على الأقل", variant: "destructive" });

    const userName = displayName || user.email?.split('@')[0] || 'مستخدم';
    const userAvatarLocal = avatarUrl || null;
    setIsSubmitting(true);

    if (isEditMode && existingReview) {
      // تعديل تقييم موجود
      const result = await updateProviderReview({
        reviewId: existingReview.id,
        userId: user.id,
        rating,
        comment: comment.trim(),
      });
      setIsSubmitting(false);
      if (!result.success) {
        toast({ title: result.error || "فشل تعديل التقييم", variant: "destructive" });
      } else {
        onReviewAdded(result.review, 'success');
        toast({ title: "تم تعديل تقييمك بنجاح!" });
        setIsEditMode(false);
      }
      return;
    }

    // إضافة تقييم جديد
    const tempReview = {
      id: `temp-${Date.now()}`,
      rating, comment,
      created_at: new Date().toISOString(),
      user_id: user.id,
      user_name: userName,
      user_avatar_url: userAvatarLocal,
      isOptimistic: true,
    };
    onReviewAdded(tempReview);

    const result = await addProviderReview({
      providerId, rating,
      comment: comment.trim(),
      userId: user.id,
      userName,
      userAvatar: userAvatarLocal,
    });

    setIsSubmitting(false);

    if (!result.success) {
      onReviewAdded(tempReview, 'remove');
      if (result.error?.includes('لقد قمت بتقييم')) {
        toast({ title: "قيّمت هذا المزود مسبقاً", description: "يمكنك تعديل تقييمك الحالي", variant: "destructive" });
        setIsEditMode(true);
      } else {
        toast({ title: result.error || "فشل إرسال التقييم", variant: "destructive" });
      }
    } else {
      onReviewAdded(result.review, 'success');
      toast({ title: "تم إرسال تقييمك بنجاح!" });
      setRating(0);
      setHover(0);
      setComment("");
    }
  };

  if (authLoading) {
    return (
      <div className="bg-muted p-4 rounded-lg flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-lg space-y-3">
      <h3 className="font-semibold text-sm">
        {isEditMode ? "تعديل تقييمك" : "أضف تقييمك"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`h-6 w-6 cursor-pointer ${(hover || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            />
          ))}
          <span className="mr-2 text-sm">{rating > 0 ? `${rating} من 5` : "اختر تقييمك"}</span>
        </div>

        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="صف تجربتك مع مقدم الخدمة... (10 أحرف على الأقل)"
          className="min-h-[100px]"
          disabled={isSubmitting}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || !user || rating === 0}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإرسال...</>
            ) : isEditMode ? (
              <><Check className="h-4 w-4 ml-2" />حفظ التعديل</>
            ) : 'إرسال التقييم'}
          </Button>
          {isEditMode && existingReview && (
            <Button type="button" variant="outline" onClick={() => {
              setIsEditMode(false);
              setRating(existingReview.rating);
              setComment(existingReview.comment);
            }}>
              <X className="h-4 w-4 ml-1" />إلغاء
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
