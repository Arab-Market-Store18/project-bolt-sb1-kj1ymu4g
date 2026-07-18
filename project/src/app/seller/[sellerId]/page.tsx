// المسار: src/app/seller/[sellerId]/page.tsx

import { Suspense } from 'react';
import ProfileMerchantPage from '@/features/merchant/profile-merchant/ProfileMerchantPage'; // ⬅️ بدون { }
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

interface SellerProfileRouteProps {
  params: Promise<{ sellerId: string }>;
}

export default async function SellerProfilePage({ params }: SellerProfileRouteProps) {
  const { sellerId } = await params;

  if (!sellerId) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <p className="text-red-500">لم يتم توفير معرّف التاجر.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileMerchantPage sellerId={sellerId} />
      </Suspense>
    </div>
  );
}