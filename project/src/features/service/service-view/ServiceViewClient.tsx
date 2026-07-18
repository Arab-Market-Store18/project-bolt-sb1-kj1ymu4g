// src/features/service/service-view/ServiceViewClient.tsx
// -- النسخة النهائية -- تم تعليق المكونات التي تسبب بطء --

"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useModal } from "@/hooks/use-modal";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// --- استيراد المكونات والأنواع ---
import { ServiceHeader } from './components/layout/ServiceHeader';
import { ServiceActionsBar } from './components/layout/ServiceActionsBar';
import { ServiceMediaGallery } from './components/sections/ServiceMediaGallery';
import { ServiceDetailsSection } from './components/sections/ServiceDetailsSection';
import { ServiceReviewsSection } from './components/sections/ServiceReviewsSection';
import { ServiceProviderInfo } from './components/sections/ServiceProviderInfo';
import { useServiceMedia } from './hooks/useServiceMedia';
import type { Service, ReviewWithReplies, Category, ServiceProvider } from './types/service.types';
import type { User } from "@supabase/supabase-js";
import { getOptimizedMediaUrl } from "@/lib/utils/cloudinary";

import { toggleServiceLikeAction as toggleServiceLike } from './actions/toggleLike.action';
import { toggleServiceSaveAction as toggleServiceSave } from './actions/toggleSave.action';

// --- استيراد مكونات التوصيات للخدمات (معلقة حالياً) ---
 import { RelatedServices } from './components/recommendations/RelatedServices';
 import { PopularServices } from './components/recommendations/PopularServices';
 import { ServiceSimilarServices } from './components/sections/ServiceSimilarServices';
 import { CrossSellPicks } from '@/components/recommendations/CrossSellPicks';
import { DallahDiscussionSection } from '@/components/dallah-discussion-section';

// --- تعريف Props للمكون ---
interface ServiceViewClientProps {
  initialService: Service;
  initialReviews: ReviewWithReplies[];
  initialSimilarServices: any[];
  allCategories: Category[];
}

export const ServiceViewClient = ({
  initialService,
  initialReviews,
  initialSimilarServices,
  allCategories,
}: ServiceViewClientProps) => {
  const router = useRouter();
  const { onOpen } = useModal();

  const [service, setService] = useState<Service>(initialService);
  const [reviews, setReviews] = useState<ReviewWithReplies[]>(initialReviews);
  // استخدام AuthContext بدل إدارة الجلسة بشكل منفصل
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const [isLiked, setIsLiked] = useState(initialService.user_interaction?.has_liked || false);
  const [isSaved, setIsSaved] = useState(initialService.user_interaction?.has_saved || false);
  const [isLoading, setIsLoading] = useState(false);

  const provider = useMemo(() => service.service_providers || service.provider, [service]);

  // --- معالجة الإعجاب ---
  const handleLikeClick = useCallback(async () => {
    if (isAuthLoading) return;
    if (!currentUser) {
      onOpen('emailSignUp');
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleServiceLike(service.id);
      
      if (result.success) {
        setIsLiked(result.liked);
        toast.success(result.liked ? "تم الإعجاب بالخدمة" : "تم إلغاء الإعجاب");
        
        setService(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            like_count: result.liked 
              ? (prev.stats?.like_count || 0) + 1 
              : (prev.stats?.like_count || 0) - 1
          },
          user_interaction: {
            ...prev.user_interaction,
            has_liked: result.liked
          }
        }));
      } else {
        toast.error(result.error || "حدث خطأ أثناء الإعجاب");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [service.id, currentUser]);

  // --- معالجة الحفظ ---
  const handleSaveClick = useCallback(async () => {
    if (isAuthLoading) return;
    if (!currentUser) {
      onOpen('emailSignUp');
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleServiceSave(service.id);
      
      if (result.success) {
        setIsSaved(result.saved);
        toast.success(result.saved ? "تم حفظ الخدمة" : "تم إلغاء الحفظ");
        
        setService(prev => ({
          ...prev,
          user_interaction: {
            ...prev.user_interaction,
            has_saved: result.saved
          }
        }));
      } else {
        toast.error(result.error || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [service.id, currentUser]);

  // --- معالجة مشاركة الخدمة ---
  const handleShareClick = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: service.name || service.title,
        text: service.description?.substring(0, 100) || service.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط إلى الحافظة");
    }
  }, [service]);

  // --- التنقل إلى صفحة الموفر ---
  const handleNavigateToProvider = useCallback(() => {
    if (provider?.id) {
      router.push(`/provider/${provider.id}`);
    }
  }, [provider, router]);

  // --- الاتصال عبر الواتساب ---
  const handleWhatsAppClick = useCallback(() => {
    const whatsappNumber = provider?.whatsapp;
    if (whatsappNumber) {
      const message = encodeURIComponent(`مرحباً، أنا مهتم بالخدمة: ${service.name}`);
      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${message}`, "_blank");
    } else {
      toast.info("رقم الواتساب غير متوفر لمقدم هذه الخدمة.");
    }
  }, [service.name, provider]);

  // تم نقل إدارة المستخدم إلى useAuth()

  // --- تحديث البيانات عند تغيير initialService ---
  useEffect(() => {
    setService(initialService);
    setReviews(initialReviews);
    setIsLiked(initialService.user_interaction?.has_liked || false);
    setIsSaved(initialService.user_interaction?.has_saved || false);
  }, [initialService, initialReviews]);

  const headerBackgroundImage = useMemo(() =>
    getOptimizedMediaUrl(provider?.store_image_url || '/images/default-cover.jpg', 'image'),
    [provider]
  );

  return (
    <div className="bg-background min-h-screen w-full">
      {/* العنوان الرئيسي */}
      <ServiceHeader
        provider={provider}
        headerBackgroundImage={headerBackgroundImage}
        onNavigateToProvider={handleNavigateToProvider}
      />

      <div className="container max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* العمود الأيسر (ثابت على الشاشات الكبيرة) */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:self-start space-y-6 sm:space-y-8">
            {/* معرض الوسائط */}
            <ServiceMediaGallery 
              service={service} 
              onLikeClick={handleLikeClick}
              onSaveClick={handleSaveClick}
              onShareClick={handleShareClick}
              isLiked={isLiked}
              isSaved={isSaved}
              isLoading={isLoading}
            />

            {/* خدمات أخرى من نفس الموفر - معلق مؤقتاً */}
      
            {service.service_providers && (
              <div className="bg-white rounded-lg border p-3 sm:p-4 shadow-sm">
                <Suspense fallback={null}>
                  <RelatedServices
                    providerId={service.service_providers.id}
                    currentServiceId={service.id}
                    providerName={service.service_providers.business_name}
                  />
                </Suspense>
              </div>
            )}
       
          </div>

          {/* العمود الأيمن (المحتوى الرئيسي) */}
          <div className="lg:col-span-2 w-full">
            {/* تفاصيل الخدمة */}
            <ServiceDetailsSection 
              service={service} 
              currentUser={currentUser}
              onOpen={onOpen}
            />

            {/* معلومات الموفر */}
            <ServiceProviderInfo provider={provider} />

            {/* ── قسم الدردشة / النقاش ── */}
            <div className="mt-8">
              <Suspense fallback={null}>
                <DallahDiscussionSection
                  service={service}
                  currentUser={currentUser}
                  onOpenAuthModal={() => onOpen('emailSignUp')}
                />
              </Suspense>
            </div>

            {/* قسم التقييمات */}
            <div className="mt-8">
              <ServiceReviewsSection 
                reviewsWithReplies={reviews} 
                service={service} 
                currentUser={currentUser}
                isAuthLoading={isAuthLoading}
                onOpen={onOpen}
                onDataChange={() => router.refresh()}
              />
            </div>
          </div>
        </div>

        {/* خدمات مشابهة - معلقة مؤقتاً */}
        <ServiceSimilarServices 
          similarServices={initialSimilarServices} 
          allCategories={allCategories} 
        />
      

        {/* الخدمات الشائعة - معلقة مؤقتاً */}

        <div className="mt-6 sm:mt-8 bg-white rounded-lg border p-3 sm:p-4 shadow-sm">
          <Suspense fallback={null}>
            <PopularServices />
          </Suspense>
        </div>
    
      </div>

      {/* شريط الإجراءات (عرض على الهواتف فقط) */}
      <div className="lg:hidden">
        <ServiceActionsBar
          whatsappNumber={provider?.whatsapp}
          mobilePhone={provider?.phone_numbers?.[0]?.number}
          onWhatsAppClick={handleWhatsAppClick}
          onSaveClick={handleSaveClick}
          onShareClick={handleShareClick}
          isSaved={isSaved}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
