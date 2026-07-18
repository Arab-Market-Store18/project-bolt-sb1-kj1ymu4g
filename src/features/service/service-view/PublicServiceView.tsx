// المسار: src/features/service/service-view/PublicServiceView.tsx
// -- النسخة المعدلة --

import React from "react";
import { notFound } from "next/navigation";
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCachedService, getServiceReviews } from './actions/fetchService.action';
import { getSimilarServicesAction } from './actions/getSimilarServices.action';
import { ServiceViewClient } from './ServiceViewClient';
import { ReviewWithReplies } from "./types/service.types";

interface PublicServiceViewProps {
  serviceId: string;
}

export const PublicServiceView = async ({ serviceId }: PublicServiceViewProps) => {
  
  // جلب الخدمة والتقييمات أولاً
  const serviceResult = await getCachedService(serviceId);

  const { service, error: serviceError } = serviceResult;

  if (!service || serviceError) {
    return (
       <div className="flex flex-col justify-center items-center min-h-screen bg-background text-center p-4">
        <h2 className="text-2xl font-bold">عذراً، الخدمة غير موجودة</h2>
        <p className="text-muted-foreground mt-2">قد يكون الرابط غير صحيح أو تم حذف الخدمة.</p>
        <Button asChild className="mt-6">
          <a href="/"><ArrowLeft className="ml-2 h-4 w-4" /> العودة للرئيسية</a>
        </Button>
      </div>
    );
  }

  // جلب الخدمات المشابهة بعد التأكد من وجود الخدمة
  let similarServicesResult = { services: [] };
  
  if (service.category_id) {
    try {
      const result = await getSimilarServicesAction({
        serviceId: serviceId,
        categoryId: service.category_id,
        sortBy: 'relevance',
        minPrice: 0,
        maxPrice: 100000,
        onlyVerified: false,
        onlyFeatured: false,
        limit: 6
      });
      
      similarServicesResult = { 
        services: result.success ? (result.data || []) : [] 
      };
    } catch (error) {
      console.error('خطأ في جلب الخدمات المشابهة:', error);
    }
  }

  const cookieStore = cookies();
  const supabase = await createSupabaseServerClient();

  const [{ data: allCategories }, reviewsResult] = await Promise.all([
    supabase.from('categories').select('*'),
    getServiceReviews(serviceId),
  ]);

  // دمج عدد التقييمات والمتوسط في كائن الخدمة حتى تعرضها صفحة التفاصيل
  const serviceWithRatings = {
    ...service,
    average_rating: reviewsResult.avg_rating,
    review_count: reviewsResult.review_count,
  };

  return (
    <ServiceViewClient
      initialService={serviceWithRatings}
      initialReviews={reviewsResult.reviews as ReviewWithReplies[]}
      initialSimilarServices={similarServicesResult.services || []}
      allCategories={allCategories || []}
    />
  );
};

export const PublicServiceViewSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* الهيدر */}
      <div className="relative">
        <div className="h-64 w-full bg-gray-200 rounded-none" />
        <div className="container mx-auto px-4 -mt-16 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* صورة الملف الشخصي */}
            <div className="h-32 w-32 rounded-xl md:rounded-2xl bg-gray-300" />
            
            {/* المعلومات */}
            <div className="flex-1 pb-6">
              <div className="h-8 w-3/4 bg-gray-300 rounded mb-3" />
              <div className="h-4 w-1/2 bg-gray-300 rounded mb-4" />
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="h-6 w-16 bg-gray-300 rounded-full" />
                <div className="h-6 w-20 bg-gray-300 rounded-full" />
                <div className="h-6 w-24 bg-gray-300 rounded-full" />
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-32 bg-gray-300 rounded-lg" />
                <div className="h-10 w-32 bg-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأيسر */}
          <div className="lg:col-span-1 space-y-6">
            {/* معرض الصور */}
            <div className="aspect-square w-full rounded-xl bg-gray-300" />
            
            {/* خدمات مشابهة */}
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-300 rounded" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-32 w-full bg-gray-300 rounded-lg" />
                    <div className="h-4 w-3/4 bg-gray-300 rounded" />
                    <div className="h-4 w-1/2 bg-gray-300 rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* توصيات */}
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-300 rounded" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-16 w-16 bg-gray-300 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full bg-gray-300 rounded" />
                      <div className="h-4 w-3/4 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* العمود الأيمن */}
          <div className="lg:col-span-2 space-y-8">
            {/* تفاصيل الخدمة */}
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-300 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-300 rounded" />
                <div className="h-4 w-full bg-gray-300 rounded" />
                <div className="h-4 w-2/3 bg-gray-300 rounded" />
              </div>
            </div>

            {/* معلومات الموفر */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-300 rounded" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-300 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-300 rounded" />
                  <div className="h-4 w-32 bg-gray-300 rounded" />
                </div>
              </div>
            </div>

            {/* التقييمات */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-300 rounded" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-300 rounded" />
                        <div className="h-3 w-24 bg-gray-300 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-gray-300 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* الخدمات الشائعة */}
            <div className="space-y-4">
              <div className="h-6 w-40 bg-gray-300 rounded" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-32 w-full bg-gray-300 rounded-lg" />
                    <div className="h-4 w-3/4 bg-gray-300 rounded" />
                    <div className="h-4 w-1/2 bg-gray-300 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط الإجراءات للجوال */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex justify-between items-center">
          <div className="h-12 w-32 bg-gray-300 rounded-lg" />
          <div className="h-12 w-32 bg-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default PublicServiceView;