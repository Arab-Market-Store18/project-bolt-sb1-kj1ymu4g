// app/services/[id]/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { Suspense } from 'react';

// استيراد المكون الجديد من الهيكل المنظم
import { PublicServiceView } from '@/features/service/service-view/PublicServiceView';

// Skeleton أثناء التحميل
const ServicePageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    {/* الهيدر */}
    <div className="h-64 bg-gray-200"></div>
    
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الأيسر */}
        <div className="lg:col-span-1 space-y-6">
          <div className="aspect-square bg-gray-200 rounded-xl"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
        
        {/* العمود الأيمن */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          <div className="h-32 bg-gray-200 rounded"></div>
          
          <div className="h-48 bg-gray-200 rounded"></div>
          
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

interface ServicePageProps {
  params: { id: string };
}

export default async function ServicePage({ params }: ServicePageProps) {
  try {
    // استخراج معرّف الخدمة
    const { id: serviceId } = await params;

    // التحقق من صحة المعرّف
    if (!serviceId || serviceId === "undefined" || serviceId === "null") {
      console.error('❌ معرّف الخدمة غير صالح');
      notFound();
    }

    console.log(`🚀 تحميل صفحة الخدمة: ${serviceId}`);

    // عرض المكون الجديد - يتحمل مسؤولية جلب البيانات
    return (
      <Suspense fallback={<ServicePageSkeleton />}>
        <PublicServiceView serviceId={serviceId} />
      </Suspense>
    );

  } catch (error: any) {
    console.error('🔥 خطأ في ServicePage:', error.message);
    
    // صفحة خطأ
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            حدث خطأ غير متوقع
          </h1>
          
          <p className="text-gray-600 mb-2">
            عذراً، لم نتمكن من تحميل صفحة الخدمة
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            يرجى المحاولة مرة أخرى أو التواصل مع الدعم
          </p>
          
          <div className="space-y-4">
            <a 
              href="/" 
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              العودة للرئيسية
            </a>
            
            <a 
              href="/services" 
              className="block w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              تصفح جميع الخدمات
            </a>
            
            <button 
              onClick={() => window.location.reload()}
              className="block w-full text-blue-600 hover:text-blue-800 font-medium py-2"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              خطأ: {error.message || 'غير معروف'}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

// Metadata الديناميكية للصفحة
export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    return {
      title: `خدمة ${id} | سوق العرب`,
      description: 'عرض تفاصيل الخدمة على منصة سوق العرب',
    };
  } catch {
    return {
      title: 'عرض الخدمة | سوق العرب',
      description: 'عرض تفاصيل الخدمة على منصة سوق العرب',
    };
  }
}