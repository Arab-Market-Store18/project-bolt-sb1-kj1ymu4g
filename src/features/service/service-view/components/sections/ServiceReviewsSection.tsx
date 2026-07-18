// المسار: features/service/service-view/components/sections/ServiceReviewsSection.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Star, Loader2, Send, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { useAuth } from '@/context/AuthContext';
import { createServiceReview } from '../../actions/reviews/createServiceReview.action';
import { updateServiceReview } from '../../actions/reviews/updateServiceReview.action';
import { deleteServiceReview } from '../../actions/reviews/deleteServiceReview.action';
import type { ServiceReviewsSectionProps, ReviewWithReplies } from '../../types/service.types';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ar-SA', {
    hour: 'numeric', minute: 'numeric',
    year: 'numeric', month: 'short', day: 'numeric', hour12: true
  });
};

export const ServiceReviewsSection = React.memo(({
  reviewsWithReplies,
  service,
  currentUser,
  isAuthLoading = false,
  onOpen,
  onDataChange,
}: ServiceReviewsSectionProps) => {
  const { displayName, avatarUrl: authAvatarUrl } = useAuth();
  const provider = service.service_providers;

  // هل سبق للمستخدم أن قيّم هذه الخدمة؟
  const existingUserReview = currentUser
    ? reviewsWithReplies.find(r => r.user_id === currentUser.id && !r.parent_review_id) ?? null
    : null;

  // ── حالة إضافة تقييم جديد ──
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── حالة تعديل تقييم موجود ──
  const [editingReviewId, setEditingReviewId] = useState<string | null>(
    existingUserReview ? existingUserReview.id : null
  );
  const [editRating, setEditRating] = useState(existingUserReview?.rating || 0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState(existingUserReview?.comment || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // إذا تغيرت قائمة التقييمات (بعد revalidation)، حدّث الحالة
  useEffect(() => {
    if (existingUserReview && editingReviewId === existingUserReview.id) {
      setEditRating(existingUserReview.rating || 0);
      setEditComment(existingUserReview.comment || "");
    }
  }, [existingUserReview]);

  const handleInteraction = useCallback(() => {
    // لا تفتح المودال أثناء تحميل المصادقة — ربما المستخدم مسجّل دخوله بالفعل
    if (isAuthLoading) return false;
    if (!currentUser) { onOpen('emailSignUp'); return false; }
    return true;
  }, [currentUser, isAuthLoading, onOpen]);

  // ── إضافة تقييم جديد ──
  const handleReviewSubmit = useCallback(async () => {
    if (!handleInteraction()) return;
    if (rating === 0) { toast.warning("الرجاء اختيار تقييم (عدد النجوم)."); return; }
    if (reviewComment.trim() === "") { toast.warning("الرجاء كتابة تعليق."); return; }
    if (!provider) { toast.error("لا يمكن إضافة تقييم لخدمة بدون مقدم خدمة."); return; }
    const providerAuthId = provider.user_id || provider.id;
    if (currentUser!.id === providerAuthId) { toast.error("لا يمكنك تقييم خدمتك الخاصة."); return; }

    setIsSubmittingReview(true);

    // استخدام currentUser مباشرةً بدلاً من getUser() (طلب شبكي إضافي)
    // currentUser موجود لأن handleInteraction() تحقّقت منه أعلاه
    const freshUser = currentUser!;

    // الاسم والصورة من useAuth() — لا حاجة لطلب شبكي إضافي
    const userName = displayName || freshUser.user_metadata?.full_name || freshUser.email?.split('@')[0] || 'مستخدم';
    const userAvatarUrl = authAvatarUrl || null;

    const { error } = await createServiceReview({
      serviceId: service.id,
      userId: freshUser.id,
      providerAuthId,
      rating,
      comment: reviewComment.trim(),
      userName,
      userAvatarUrl,
    });

    if (error) {
      if ((error as any).code === '23505') {
        toast.info("لقد قيّمت هذه الخدمة مسبقاً. يمكنك تعديل تقييمك.");
        const prev = reviewsWithReplies.find(r => r.user_id === freshUser.id && !r.parent_review_id);
        if (prev) {
          setEditingReviewId(prev.id);
          setEditRating(prev.rating || rating);
          setEditComment(prev.comment || reviewComment);
        }
      } else if ((error as any).code === 'OWN_SERVICE') {
        toast.error("لا يمكنك تقييم خدمتك الخاصة.");
      } else {
        toast.error("حدث خطأ أثناء إرسال التقييم.", { description: (error as any).message });
      }
    } else {
      toast.success("شكراً لك، تم إرسال تقييمك بنجاح!");
      onDataChange();
      setRating(0);
      setReviewComment("");
    }
    setIsSubmittingReview(false);
  }, [currentUser, displayName, authAvatarUrl, rating, reviewComment, service, provider, onDataChange, handleInteraction, reviewsWithReplies]);

  // ── حذف تقييم ──
  const handleDeleteReview = useCallback(async (reviewId: string) => {
    if (!window.confirm("هل أنت متأكد من أنك تريد حذف هذا التقييم؟")) return;
    toast.loading("جاري الحذف...");
    const { error } = await deleteServiceReview(reviewId);
    toast.dismiss();
    if (error) {
      toast.error("فشل الحذف.", { description: (error as any).message });
    } else {
      toast.success("تم الحذف بنجاح.");
      if (editingReviewId === reviewId) setEditingReviewId(null);
      onDataChange();
    }
  }, [onDataChange, editingReviewId]);

  // ── بدء تعديل تقييم ──
  const handleStartEdit = (review: ReviewWithReplies) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating || 0);
    setEditComment(review.comment || "");
    setEditHoverRating(0);
  };

  // ── إلغاء التعديل ──
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  // ── حفظ التعديل ──
  const handleSaveEdit = useCallback(async () => {
    if (!editingReviewId) return;
    if (editRating === 0) { toast.warning("الرجاء اختيار تقييم."); return; }
    if (editComment.trim() === "") { toast.warning("الرجاء كتابة تعليق."); return; }

    setIsSavingEdit(true);
    toast.loading("جاري تحديث التقييم...");
    const { error } = await updateServiceReview({
      reviewId: editingReviewId,
      rating: editRating,
      comment: editComment.trim(),
    });
    toast.dismiss();

    if (error) {
      toast.error("فشل تحديث التقييم.", { description: (error as any).message });
    } else {
      toast.success("تم تعديل تقييمك بنجاح!");
      onDataChange();
      handleCancelEdit();
    }
    setIsSavingEdit(false);
  }, [editingReviewId, editRating, editComment, onDataChange]);

  // عدد التقييمات الأصلية (غير الردود)
  const topLevelReviews = reviewsWithReplies.filter(r => !r.parent_review_id);

  return (
    <section id="service-reviews" className="scroll-mt-24">
      <h2 className="text-lg font-semibold mb-4">
        تقييمات الخدمة ({topLevelReviews.length})
      </h2>
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
              disabled={isSubmittingReview}
              onFocus={() => { if (!handleInteraction()) textareaRef.current?.blur(); }}
            />
            <Button onClick={handleReviewSubmit} disabled={isSubmittingReview || rating === 0}>
              {isSubmittingReview ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
              {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
            </Button>
          </div>
        ) : (
          /* قيّم مسبقاً → عرض تقييمه مع زر التعديل (أو نموذج التعديل مباشرة) */
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-700 mb-2">تقييمك لهذه الخدمة</p>
            {editingReviewId === existingUserReview.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">التقييم:</span>
                  <div className="flex" onMouseLeave={() => setEditHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 cursor-pointer transition-all ${(editHoverRating || editRating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        onMouseEnter={() => setEditHoverRating(star)}
                        onClick={() => setEditRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="عدّل تعليقك..."
                  className="min-h-[80px]"
                  disabled={isSavingEdit}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={isSavingEdit || editRating === 0 || editComment.trim() === ''} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <Check className="h-4 w-4 ml-1" />}
                    حفظ التعديل
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSavingEdit}>
                    <X className="h-4 w-4 ml-1" /> إلغاء
                  </Button>
                </div>
              </div>
            ) : (
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
            )}
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{review.user_name}</h4>
                        {isOwner && !isEditing && (
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

                    {/* ردود مزود الخدمة */}
                    {!isEditing && review.replies && review.replies.length > 0 && (
                      <div className="mt-4 ml-4 p-4 bg-gray-100 rounded-lg space-y-4 border-r-2 border-primary">
                        {review.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={provider?.logo_url || provider?.avatar_url || undefined} />
                              <AvatarFallback>{provider?.business_name?.charAt(0) || 'م'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-sm">{provider?.business_name}<span className="text-xs font-normal text-primary mr-1">(مزود الخدمة)</span></h5>
                                <span className="text-xs text-muted-foreground">{formatDate(reply.created_at)}</span>
                              </div>
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
            <p className="text-sm mt-1">كن أول من يقيّم هذه الخدمة!</p>
          </div>
        )}
      </div>
    </section>
  );
});

ServiceReviewsSection.displayName = 'ServiceReviewsSection';
