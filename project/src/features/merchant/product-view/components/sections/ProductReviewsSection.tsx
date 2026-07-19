// features/merchant/product-view/components/sections/ProductReviewsSection.tsx

import React, { useState, useRef, useCallback } from 'react';
import { User } from "@supabase/supabase-js";
import { useAuth } from '@/context/AuthContext';
import { Star, Loader2, Send, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ReviewWithReplies } from '../../types/review.types';
import { ProductDetails } from '../../types/product.types';
import { formatDate } from '../../utils/formatters';
import { createReview } from '../../actions/reviews/createReview.action';
import { deleteReview } from '../../actions/reviews/deleteReview.action';
import { updateReview } from '../../actions/reviews/updateReview.action';
import { toast } from "sonner";

interface ProductReviewsSectionProps {
  product: ProductDetails;
  reviewsWithReplies: ReviewWithReplies[];
  currentUser: User | null;
  isAuthLoading?: boolean;
  onOpenAuthModal: () => void;
  onDataChange: () => void;
}

export function ProductReviewsSection({ product, reviewsWithReplies, currentUser, isAuthLoading = false, onOpenAuthModal, onDataChange }: ProductReviewsSectionProps) {
  const { displayName, avatarUrl } = useAuth();
  // هل سبق للمستخدم أن قيّم هذا المنتج؟
  const existingUserReview = currentUser
    ? reviewsWithReplies.find(r => r.user_id === currentUser.id && !r.parent_review_id) ?? null
    : null;

  // حالة إضافة تقييم جديد
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // حالة تعديل تقييم موجود
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleInteraction = useCallback(() => {
    // لا تفتح المودال أثناء تحميل المصادقة — المستخدم قد يكون مسجّلاً بالفعل
    if (isAuthLoading) return false;
    if (!currentUser) { onOpenAuthModal(); return false; }
    return true;
  }, [currentUser, isAuthLoading, onOpenAuthModal]);

  // ── إضافة تقييم جديد ──
  const handleReviewSubmit = async () => {
    if (!handleInteraction() || !product.sellers) return;
    setIsSubmitting(true);
    const { error } = await createReview({
      productId: product.id,
      userId: currentUser!.id,
      sellerId: product.sellers.id,
      rating,
      comment: reviewComment,
      userName: displayName || undefined,
      userAvatar: avatarUrl,
    });
    if (!error) {
      toast.success("شكراً لك، تم إرسال تقييمك بنجاح!");
      onDataChange();
      setRating(0);
      setReviewComment("");
    } else if ((error as any)?.code === '23505') {
      toast.info("لقد قيّمت هذا المنتج مسبقاً. يمكنك تعديل تقييمك.");
      if (existingUserReview) {
        setEditingReviewId(existingUserReview.id);
        setEditRating(existingUserReview.rating || rating);
        setEditComment(existingUserReview.comment || reviewComment);
      }
    } else if ((error as any)?.code === 'OWN_PRODUCT') {
      toast.error("لا يمكنك تقييم منتجك الخاص.");
    } else {
      toast.error("حدث خطأ أثناء إرسال التقييم.", { description: (error as any)?.message });
    }
    setIsSubmitting(false);
  };

  // ── حذف تقييم ──
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("هل أنت متأكد من أنك تريد حذف هذا التقييم؟")) return;
    toast.loading("جاري الحذف...");
    const { error } = await deleteReview(reviewId);
    toast.dismiss();
    if (!error) {
      toast.success("تم الحذف بنجاح.");
      onDataChange();
    } else {
      toast.error("فشل الحذف.", { description: (error as any)?.message });
    }
  };

  // ── بدء تعديل تقييم ──
  const handleStartEdit = (review: ReviewWithReplies) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating || 0);
    setEditComment(review.comment);
    setEditHoverRating(0);
  };

  // ── إلغاء التعديل ──
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  // ── حفظ التعديل ──
  const handleSaveEdit = async () => {
    if (!editingReviewId) return;
    setIsSavingEdit(true);
    toast.loading("جاري تحديث التقييم...");
    const { error } = await updateReview({ reviewId: editingReviewId, rating: editRating, comment: editComment });
    toast.dismiss();
    if (!error) {
      toast.success("تم تحديث تقييمك بنجاح!");
      onDataChange();
      handleCancelEdit();
    } else {
      toast.error("فشل تحديث التقييم.", { description: (error as any)?.message });
    }
    setIsSavingEdit(false);
  };

  const topLevelReviews = reviewsWithReplies.filter(r => !r.parent_review_id);

  return (
    <section id="product-reviews" className="scroll-mt-24">
      <h2 className="text-lg font-semibold mb-4">تقييمات المنتج ({topLevelReviews.length})</h2>
      <div className="space-y-8">

        {/* ── نموذج إضافة / تعديل تقييم المستخدم الحالي ── */}
        {!existingUserReview ? (
          /* لم يُقيّم بعد → نموذج الإضافة */
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">أضف تقييمك</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600">تقييمك:</span>
              <div className="flex" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer transition-all ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => { if (handleInteraction()) setRating(star); }}
                  />
                ))}
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              placeholder="اكتب تعليقك هنا..."
              className="mb-3"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              disabled={isSubmitting}
              onFocus={() => { if (!handleInteraction()) textareaRef.current?.blur(); }}
            />
            <Button onClick={handleReviewSubmit} disabled={isSubmitting || rating === 0}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
              {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
            </Button>
          </div>
        ) : editingReviewId !== existingUserReview.id ? (
          /* قيّم مسبقاً → عرض تقييمه مع زر التعديل */
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-700 mb-2">تقييمك لهذا المنتج</p>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${(existingUserReview.rating || 0) > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-700">{existingUserReview.comment}</p>
              </div>
              <div className="flex gap-1 mr-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => handleStartEdit(existingUserReview)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteReview(existingUserReview.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* وضع التعديل الكامل */
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
            <p className="text-sm font-medium text-blue-700">تعديل تقييمك</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">التقييم:</span>
              <div className="flex" onMouseLeave={() => setEditHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-5 w-5 cursor-pointer transition-all ${(editHoverRating || editRating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onMouseEnter={() => setEditHoverRating(star)} onClick={() => setEditRating(star)} />
                ))}
              </div>
            </div>
            <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} placeholder="عدّل تعليقك..." className="min-h-[80px]" disabled={isSavingEdit} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit || editRating === 0 || editComment.trim() === ''} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Check className="h-4 w-4 ml-1" />} حفظ التعديل
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSavingEdit}><X className="h-4 w-4 ml-1" /> إلغاء</Button>
            </div>
          </div>
        )}

        {/* ── قائمة التقييمات ── */}
        {topLevelReviews.length > 0 ? (
          <div className="max-h-[40rem] overflow-y-auto pr-4 space-y-6 border-t pt-6">
            {topLevelReviews.map((review) => {
              const isOwner = currentUser && currentUser.id === review.user_id;
              const isEditing = editingReviewId === review.id;

              return (
                <div key={review.id} className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={review.user_avatar_url || '/placeholder-user.jpg'} />
                    <AvatarFallback>{review.user_name?.charAt(0) || 'م'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    {/* رأس التقييم */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{review.user_name}</h4>
                        {isOwner && !isEditing && review.id !== existingUserReview?.id && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-100" onClick={() => handleStartEdit(review)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100" onClick={() => handleDeleteReview(review.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                    </div>

                    {/* وضع التعديل */}
                    {isEditing && review.id !== existingUserReview?.id ? (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-medium text-blue-700">تعديل تقييمك</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">التقييم:</span>
                          <div className="flex" onMouseLeave={() => setEditHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`h-5 w-5 cursor-pointer transition-all ${(editHoverRating || editRating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                onMouseEnter={() => setEditHoverRating(star)} onClick={() => setEditRating(star)} />
                            ))}
                          </div>
                        </div>
                        <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} placeholder="عدّل تعليقك..." className="min-h-[80px]" disabled={isSavingEdit} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit || editRating === 0 || editComment.trim() === ''} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Check className="h-4 w-4 ml-1" />} حفظ التعديل
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSavingEdit}><X className="h-4 w-4 ml-1" /> إلغاء</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {review.rating && (
                          <div className="flex items-center gap-1 my-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${review.rating! > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </>
                    )}

                    {/* ردود البائع */}
                    {!isEditing && review.replies && review.replies.length > 0 && (
                      <div className="mt-4 ml-4 p-4 bg-gray-100 rounded-lg space-y-4 border-r-2 border-primary">
                        {review.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={product.sellers?.logo_url || undefined} />
                              <AvatarFallback>{product.sellers?.business_name?.charAt(0) || 'ب'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h5 className="font-semibold text-sm">{product.sellers?.business_name} <span className="text-xs font-normal text-primary">(البائع)</span></h5>
                              <p className="text-xs text-gray-600 mt-1">{reply.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border-t pt-6">
            <Star className="h-10 w-10 mx-auto mb-2 text-gray-200" />
            <p>لا توجد تقييمات حتى الآن.</p>
            <p className="text-sm mt-1">كن أول من يقيّم هذا المنتج!</p>
          </div>
        )}
      </div>
    </section>
  );
}
