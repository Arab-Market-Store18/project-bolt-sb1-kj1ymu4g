// src/features/merchant/profile-merchant/ProfileMerchantPage.tsx


"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from 'react-intersection-observer';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Star, Send, Info, Store, Globe, Phone, MapPin, 
  Clock, Smartphone, MessageSquare, ChevronDown, Package 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

// --- ⬇️ تم التعديل هنا ⬇️ ---

// ✅ استيراد جميع المكونات المطلوبة باستخدام المسار المستعار
import { ProfileMerchantPageSkeleton } from '@/features/merchant/profile-merchant/components/layout/ProfileMerchantPageSkeleton';
import { ProfileMerchantProductsGrid } from '@/features/merchant/profile-merchant/components/sections/ProfileMerchantProductsGrid';
import { ProfileMerchantReviewsList } from '@/features/merchant/profile-merchant/components/sections/ProfileMerchantReviewsList';
import { ProfileMerchantTrust } from '@/features/merchant/profile-merchant/components/sections/ProfileMerchantTrust';
import { ProfileMerchantFAQ } from '@/features/merchant/profile-merchant/components/ui/ProfileMerchantFAQ';
import { ProfileMerchantHeader } from '@/features/merchant/profile-merchant/components/layout/ProfileMerchantHeader';

// ✅ استيراد الدوال باستخدام المسار المستعار
import { 
  fetchSellerCoreData, 
  fetchSellerReviews, 
  submitSellerReview,
  fetchSellerProducts  
} from '@/features/merchant/profile-merchant/actions/profile-merchant.actions';
import { getContactLink, getArabicType } from '@/features/merchant/profile-merchant/utils/formatters';

// --- ⬆️ انتهى التعديل ⬆️ ---

// ✅ تعريف Props
// ... (باقي الكود يبقى كما هو)

interface ProfileMerchantPageProps {
  sellerId: string;
}

// =========== المكونات الداخلية ===========

// AboutSection
const AboutSection = ({ description, storeType, city }: { description: string | null, storeType: 'physical' | 'online' | null, city?: string }) => {  
  if (!description && !storeType) return null;
  
  const storeTypeInfo = { 
    physical: { text: 'محل فعلي', Icon: Store }, 
    online: { text: 'عبر الإنترنت', Icon: Globe } 
  } as const;
  
  const currentStoreType = storeType ? storeTypeInfo[storeType] : null;
  
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info className="h-5 w-8 text-primary" />
        <span>عن المتجر</span>
      </h2>
      <div className="bg-muted p-4 rounded-lg space-y-4">
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
        
        {currentStoreType && (
          <div className="flex items-center gap-3 pt-3 border-t">
            <currentStoreType.Icon className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">نوع المتجر</p>
              <p className="text-sm text-muted-foreground">{currentStoreType.text}</p>
            </div>
          </div>
        )}
        
    {/* المدينة   */}
{city && (
  <div className="flex items-center gap-3 pt-3 border-t">
    <MapPin className="h-6 w-6 text-primary" />
    <div>
      <p className="font-semibold">الموقع</p>
      <p className="text-sm text-muted-foreground">{city}</p>
    </div>
  </div>
)}
      </div>
    </section>
  );
};

// ContactSection
const ContactSection = ({ seller, className }: { seller: any, className?: string }) => {  const phoneNumbers = seller?.phone_numbers || [];
  const workingHours = seller?.working_hours;
  const city = seller?.city;
  
  if (phoneNumbers.length === 0 && !workingHours && !city) return null;

  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-4">معلومات التواصل</h2>
      <div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
        {phoneNumbers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>أرقام التواصل</span>
            </h3>
            {phoneNumbers.map((phone: any, i: number) => (
              <a 
                key={i} 
                href={getContactLink(phone)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 group cursor-pointer"
              >
                {phone.type.toLowerCase() === 'whatsapp' ? (
                  <Smartphone className="h-4 w-4 text-green-500" />
                ) : (
                  <Phone className="h-4 w-4 text-gray-500" />
                )}
                <span className="font-mono text-sm group-hover:text-primary group-hover:underline" dir="ltr">
                  {phone.number}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({getArabicType(phone.type)})
                </span>
              </a>
            ))}
          </div>
        )}
        <div className="space-y-4">
          {workingHours && (
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>أوقات العمل</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{workingHours}</p>
            </div>
          )}
          {city && (
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>الموقع</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{city}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// AddReviewSection
const AddReviewSection = ({ sellerId }: { sellerId: string }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) => 
      submitSellerReview(sellerId, { rating, comment }),
    onSettled: async (data, error) => {
      if (error) {
        if (error?.message?.includes("User not authenticated")) {
          toast({ 
            title: "يجب تسجيل الدخول", 
            description: "سجل الدخول لتتمكن من التقييم",
            action: <ToastAction altText="تسجيل الدخول">تسجيل</ToastAction>
          });
        } else if (error.message.includes("Seller cannot review their own store")) {
          toast({ 
            title: "لا يمكن تقييم متجرك", 
            description: "لا يمكنك تقييم متجرك الخاص", 
            variant: "destructive" 
          });
        } else if (error.message.includes("User has already reviewed this seller")) {
          toast({ 
            title: "تقييم مسبق", 
            description: "لقد قمت بتقييم هذا المتجر سابقاً", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "خطأ", 
            description: "فشل إرسال التقييم، حاول مرة أخرى", 
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "✅ تم إرسال التقييم", 
          description: "شكراً لك على تقييمك" 
        });
        setRating(0);
        setComment("");
        await queryClient.invalidateQueries({ 
          queryKey: ['seller-reviews', sellerId],
          refetchType: 'active'
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === "") {
      toast({ 
        title: "بيانات ناقصة", 
        description: "اختر تقييم واكتب تعليق", 
        variant: "destructive" 
      });
      return;
    }
    submitReview({ rating, comment });
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">أضف تقييمك</h2>
      <form onSubmit={handleSubmit} className="bg-muted p-4 rounded-lg space-y-4">
        <div>
          <label className="font-medium mb-2 block">تقييمك:</label>
          <div className="flex items-center gap-1" dir="ltr">
            {[1,2,3,4,5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                aria-label={`تقييم ${star} من 5 نجوم`}
              >
                <Star 
                  className={`h-8 w-8 transition-colors ${
                    (hoverRating || rating) >= star 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="review-comment" className="font-medium mb-2 block">تعليقك:</label>
          <Textarea 
            id="review-comment" 
            placeholder="صف تجربتك مع هذا المتجر..." 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            className="min-h-[100px]" 
            disabled={isPending} 
            required
          />
        </div>
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isPending || rating === 0 || comment.trim() === ""} 
            className="min-w-32"
          >
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="ml-2 h-4 w-4" />
                إرسال التقييم
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
};

// LazyProductSection
const LazyProductSection = ({ sellerId, allCategories }: { sellerId: string, allCategories: any[] }) => {
  const { ref, inView } = useInView({ 
    triggerOnce: true, 
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: () => fetchSellerProducts(sellerId), // ✅ من actions
    enabled: inView && !!sellerId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  if (!inView) return <div ref={ref} className="min-h-[200px]" />;
  if (isLoading) return (
    <div ref={ref} className="flex justify-center items-center h-48">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  
  return <ProfileMerchantProductsGrid products={products || []} allCategories={allCategories} sellerId={sellerId} />;
};

// CollapsibleReviewsSection
const CollapsibleReviewsSection = ({ sellerId }: { sellerId: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: () => fetchSellerReviews(sellerId),
    enabled: !!sellerId,
    staleTime: 30 * 1000,
  });

  return (
    <section id="reviews-content" className="scroll-mt-24">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between bg-muted p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-expanded={isOpen}
        aria-controls="reviews-content-body"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="font-medium">تقييمات العملاء</span>
          {reviews && reviews.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              {reviews.length}
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div id="reviews-content-body" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ProfileMerchantReviewsList reviews={reviews || []} sellerId={sellerId} />
          )}
        </div>
      )}
    </section>
  );
};

// =========== المكون الرئيسي ===========
export default function ProfileMerchantPage({ sellerId }: ProfileMerchantPageProps) {
  const { toast } = useToast();
  
  if (!sellerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">لم يتم تحديد متجر لعرضه</p>
          <p className="text-sm text-muted-foreground mt-2">
            يرجى تحديد معرف المتجر الصحيح
          </p>
        </div>
      </div>
    );
  }
  
  const { data: sellerData, isLoading, isError, error } = useQuery({
    queryKey: ['seller-profile-core', sellerId],
    queryFn: () => fetchSellerCoreData(sellerId),
    enabled: !!sellerId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ProfileMerchantPageSkeleton />;
  
  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-destructive">
          <p>حدث خطأ في تحميل بيانات المتجر</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }
  
  if (!sellerData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">المتجر غير موجود</p>
          <p className="text-sm text-muted-foreground mt-2">
          </p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-[100vh] bg-background" dir="rtl">     
      <ProfileMerchantHeader seller={sellerData} />
      
      <div className="container mx-auto px-4 py-6 pb-8">
        <main className="mt-6 space-y-6">
          {/* ✅ قسم "عن المتجر" */}
          <AboutSection 
            description={sellerData.description} 
            storeType={sellerData.store_type} 
            city={sellerData.city}  // ← أضف هذا

          />
          
          {/* ✅ قسم "لماذا تشتري منا" */}
          <ProfileMerchantTrust features={sellerData.trust_features} />
          
          {/* ✅ قسم المنتجات */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span>منتجاتنا</span>
            </h2>
            <LazyProductSection 
              sellerId={sellerId} 
              allCategories={sellerData.allCategories || []} 
            />
          </section>
          
          {/* ✅ قسم التقييمات */}
          <CollapsibleReviewsSection sellerId={sellerId} />
          
          {/* ✅ قسم إضافة تقييم */}
          <AddReviewSection sellerId={sellerId} />
          
          {/* ✅ قسم الأسئلة الشائعة */}
          <ProfileMerchantFAQ faqs={sellerData.faqs || []} />
          
          {/* ✅ قسم التواصل */}
          <ContactSection seller={sellerData} />
        </main>
      </div>
    </div>
  );
}