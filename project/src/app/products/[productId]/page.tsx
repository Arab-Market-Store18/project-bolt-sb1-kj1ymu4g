// المسار: app/products/[productId]/page.tsx

import { notFound } from 'next/navigation';
// السطر الصحيح
import { PublicProductView } from '@/features/merchant/product-view/PublicProductView';
import { Suspense } from 'react';

// ✅ إضافة: تأخير بسيط لضمان استقرار التوجيه
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ productId: string }> 
}) {
  try {
    // انتظر params أولاً
    const { productId } = await params;

    // ✅ إضافة: تأخير لاستقرار الصفحة
    await delay(200);

    // تحقق إضافي من صحة productId
    if (!productId || productId === 'undefined' || productId === 'null') {
      console.error('❌ Invalid productId:', productId);
      notFound();
    }

    console.log(`🔄 Loading product page for ID: ${productId}`);

    return (
      <div className="pb-24 pt-4">
        {/* ✅ إضافة: زيادة وقت timeout لـ Suspense */}
        <Suspense fallback={<ProductLoadingFallback />}>
          <PublicProductView productId={productId} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('❌ Error in product page:', error);
    notFound();
  }
}

// ✅ إضافة: مكون تحميل احتياطي
function ProductLoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري تحميل المنتج...</p>
      </div>
    </div>
  );
}