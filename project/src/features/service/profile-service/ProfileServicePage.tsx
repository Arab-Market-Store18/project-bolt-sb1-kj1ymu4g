// features/service/profile-service/ProfileServicePage.tsx
"use client";
import { useAuth } from '@/context/AuthContext';

import React, { useState } from "react";
import { Loader2, MessageSquare, HelpCircle, Phone, Clock, MapPin } from "lucide-react";

// استيراد المكونات الفرعية والإجراءات
import { ProfileServiceHeader } from './components/ProfileServiceHeader';
import { ProfileServiceInfoCard } from './components/ProfileServiceInfoCard';
import { ProfileServiceReviewsList } from './components/ProfileServiceReviewsList';
import { LazyServiceSection } from './components/ProfileServiceGrid';
import { AddReviewForm } from './components/AddReviewForm';

// استيراد الأنواع والإجراءات من الخادم
import type { ProviderData, FAQ, PhoneNumber, ProviderReview } from './types/profile-service.types';
import { getProviderReviews, toggleFollowProvider } from './actions/profile-service.actions';

// ---------------- دالة تنسيق التاريخ ----------------
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', { 
    hour: 'numeric', 
    minute: 'numeric', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};

// ---------------- قسم الأسئلة الشائعة ----------------
const FAQSection = ({ faqs }: { faqs: FAQ[] | null }) => {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">أسئلة شائعة</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <details key={i} className="bg-muted p-3 rounded-lg cursor-pointer">
            <summary className="font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <span>{faq.q}</span>
            </summary>
            <p className="mt-2 mr-7 text-sm text-muted-foreground">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

// ---------------- قسم معلومات التواصل ----------------
const ContactSection = ({ provider }: { provider: Omit<ProviderData, 'services'> }) => {
  const phoneNumbers = provider.phone_numbers || [];
  const workingHours = provider.working_hours;
  const city = provider.city;

  if (phoneNumbers.length === 0 && !workingHours && !city) return null;

  const getContactLink = (phone: PhoneNumber) => 
    phone.type.toLowerCase() === 'whatsapp' 
      ? `https://wa.me/${phone.number.replace(/\D/g, '')}` 
      : `tel:${phone.number.replace(/\D/g, '')}`;

  const getIconForType = (type: string) => 
    type.toLowerCase() === 'whatsapp' 
      ? <Phone className="h-4 w-4 text-green-500" /> 
      : <Phone className="h-4 w-4 text-gray-500" />;

  const getArabicType = (type: string) => 
    ({ whatsapp: 'واتساب', mobile: 'جوال', landline: 'هاتف أرضي' }[type.toLowerCase()] || 'اتصال');

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">معلومات التواصل</h2>
      <div className="bg-muted p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
        {phoneNumbers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span>أرقام التواصل</span>
            </h3>
            {phoneNumbers.map((phone, i) => (
              <a 
                key={i} 
                href={getContactLink(phone)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-3 group cursor-pointer"
              >
                {getIconForType(phone.type)}
                <span className="fot-mono text-sm group-hover:text-primary group-hover:underline" dir="ltr">
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

// ---------------- المكون الرئيسي للصفحة ----------------
interface ProfileServicePageProps {
  providerId: string;
  initialProvider: ProviderData;
  initialReviews: ProviderReview[];
  initialTotalReviews: number;
  initialHasMore: boolean;
  initialFollowStatus: boolean;
}

export default function ProfileServicePage({ 
  providerId,
  initialProvider,
  initialReviews,
  initialTotalReviews,
  initialHasMore,
  initialFollowStatus
}: ProfileServicePageProps) {
  const { user, displayName, avatarUrl } = useAuth();
  console.log('👤 ProfileServicePage - user:', user?.id, 'displayName:', displayName);
  const [reviews, setReviews] = useState<ProviderReview[]>(initialReviews);
  const [provider, setProvider] = useState(initialProvider);
  const [currentPage, setCurrentPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(initialTotalReviews);

  const fetchReviews = async (pageNum: number) => {
    if (!providerId) return;
    setIsLoadingMore(true);
    const result = await getProviderReviews(providerId, pageNum, 5);
    if (result.reviews) {
      // أضف التقييمات الجديدة إلى القائمة الحالية
      setReviews(prev => [...prev, ...result.reviews]);
      setHasMore(!!result.nextPage);
      setCurrentPage(pageNum + 1);
      setTotalReviews(result.total || totalReviews);
    }
    setIsLoadingMore(false);
  };

  const loadMoreReviews = () => { if (hasMore && !isLoadingMore) fetchReviews(currentPage); };

  // ==================== التعديل الأساسي هنا ====================
  const handleReviewAdded = async (review: any, action?: 'remove' | 'success') => {
    if (action === 'remove') {
      // إزالة التقييم المؤقت في حالة فشل الإرسال
      setReviews(prev => prev.filter(r => r.id !== review.id));
    } else if (action === 'success') {
      // إعادة جلب التقييمات من الخادم بعد الإضافة الناجحة
      console.log('🔄 Refetching reviews after success...');
      const result = await getProviderReviews(providerId, 1, 5);
      console.log('📦 Refetch result:', result);
            if (result.reviews) {
        setReviews(result.reviews);
        setTotalReviews(result.total || 0);
        setHasMore(!!result.nextPage);
        setCurrentPage(2); // لأننا جلبنا الصفحة الأولى
      }
    } else {
      // إضافة التقييم المؤقت إلى بداية القائمة (تحديث متفائل)
      setReviews(prev => [review, ...prev]);
    }
  };
  // =============================================================
  
  if (!provider) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="bg-background min-h-screen">
      <ProfileServiceHeader 
        provider={provider} 
        isFollowing={initialFollowStatus} 
        followersCount={provider.followers_count} 
        isPending={false} 
        followAction={toggleFollowProvider as any} 
      />

      <main className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto">
        <ProfileServiceInfoCard provider={provider} />
        <LazyServiceSection providerId={providerId} />

        <section id="provider-reviews" className="scroll-mt-24">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>تقييمات العملاء</span>
            {totalReviews > 0 && <span className="text-sm text-muted-foreground">({totalReviews})</span>}
          </h2>

          <ProfileServiceReviewsList
            reviews={reviews}
            onLoadMore={loadMoreReviews}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        </section>

        <AddReviewForm
          providerId={providerId}
          existingReview={reviews.find(r => r.user_id === user?.id) ?? null}
          onReviewAdded={handleReviewAdded}
        />

        <FAQSection faqs={provider.faqs} />
        <ContactSection provider={provider} />
      </main>
    </div>
  );
}