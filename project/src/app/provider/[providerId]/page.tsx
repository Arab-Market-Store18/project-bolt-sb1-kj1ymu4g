// app/provider/[providerId]/page.tsx
// -- النسخة الكاملة والنهائية لجلب البيانات من الخادم --

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

// استيراد المكون الرئيسي ودوال الخادم
import ProfileServicePage from '@/features/service/profile-service/ProfileServicePage';
import { getCachedProvider, getProviderReviews, getFollowStatus } from '@/features/service/profile-service/actions/profile-service.actions';

// تعريف واجهة الخصائص للصفحة
interface ProviderProfileRouteProps {
  params: Promise<{ providerId: string }>;
}

// تعريف عدد العناصر لكل صفحة
const REVIEWS_PER_PAGE = 5;

// مكون بسيط لعرض شاشة التحميل
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

// هذا هو مكون الصفحة الفعلي (Server Component)
export default async function ProviderProfileRoute({ params }: ProviderProfileRouteProps) {
  const { providerId } = await params;

  // ✅ سجل للتصحيح
  console.log('🔥 ProviderProfileRoute rendering for providerId:', providerId);

  // التحقق من وجود المعرف
  if (!providerId) {
    console.log('❌ No providerId provided');
    notFound();
  }

  console.log('📡 Fetching data for provider:', providerId);

  // جلب بيانات مزود الخدمة والتقييمات وحالة المتابعة بالتوازي لتحسين الأداء
  const [providerResult, reviewsResult, followStatusResult] = await Promise.all([
    getCachedProvider(providerId).then(r => {
      console.log('✅ getCachedProvider result:', r);
      return r;
    }),
    getProviderReviews(providerId, 1, REVIEWS_PER_PAGE).then(r => {
      console.log('✅ getProviderReviews result:', r);
      return r;
    }),
    getFollowStatus(providerId).then(r => {
      console.log('✅ getFollowStatus result:', r);
      return r;
    })
  ]);

  // استخراج البيانات من النتائج
  const { provider, error: providerError } = providerResult;
  const { reviews, total, nextPage } = reviewsResult;
  const { isFollowing } = followStatusResult;

  // التعامل مع حالة عدم العثور على مزود الخدمة
  if (providerError || !provider) {
    console.log('❌ Provider not found:', { providerError, provider });
    notFound(); // يعرض صفحة 404 Not Found
  }

  console.log('🎉 All data fetched successfully, rendering ProfileServicePage');

  // تمرير البيانات التي تم جلبها من الخادم كخصائص (props) إلى المكون العميل
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProfileServicePage
        providerId={provider.id}
        initialProvider={provider}
        initialReviews={reviews}
        initialTotalReviews={total || 0}
        initialHasMore={!!nextPage}
        initialFollowStatus={isFollowing}
      />
    </Suspense>
  );
}