// المسار: features/service/service-view/components/sections/ServiceSimilarServices.tsx
// -- تم التعديل ليتوافق مع الأنواع الجديدة --

"use client";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card"; // سنفترض أن ProductCard يمكنه التعامل مع الخدمات
import { Swiper, SwiperSlide } from 'swiper/react';
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Category, ServiceProvider } from "../../types/service.types"; // <-- استيراد الأنواع

import 'swiper/css';

// --- التغيير الأول: تعريف نوع دقيق للخدمات المشابهة ---
interface SimilarService {
  id: string;
  name: string;
  price: number | null;
  images: string[] | string | null;
  // هذا هو شكل العلاقة الذي حددناه في دالة getSimilarServices
  service_providers: {
    id: string;
    business_name: string;
    logo_url: string | null;
  } | null;
}

interface ServiceSimilarServicesProps {
  similarServices: SimilarService[];
  allCategories: Category[];
}

export const ServiceSimilarServices = ({ 
  similarServices, 
  allCategories 
}: ServiceSimilarServicesProps) => {
  const router = useRouter();

  const handleSimilarServiceClick = useCallback((serviceId: string) => {
    router.push(`/services/${serviceId}`);
  }, [router]);

  if (!similarServices || similarServices.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">خدمات مشابهة</h2>
        {/* TODO: إضافة رابط لصفحة عرض كل الخدمات المشابهة */}
        <Button variant="ghost" className="text-primary">عرض الكل</Button>
      </div>
      <Swiper
        spaceBetween={12}
        slidesPerView={1.8}
        breakpoints={{
          400: { slidesPerView: 2.2 },
          640: { slidesPerView: 2.5 },
          768: { slidesPerView: 3.2 },
          1024: { slidesPerView: 4.2 }
        }}
        className="similar-products-swiper"
      >
        {similarServices.filter(s => s).map((service) => (
          <SwiperSlide key={service.id}>
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleSimilarServiceClick(service.id)}
            >
              {/* 
                --- التغيير الثاني: تحويل شكل البيانات ليناسب ProductCard ---
                هذا التعديل مهم جداً. نحن نمرر كائناً جديداً إلى ProductCard
                بالشكل الذي يتوقعه (نفترض أنه يتوقع `sellers` وليس `service_providers`).
              */}
              <ProductCard 
                item={{
                  ...service,
                  // إعادة تسمية الخاصية لتناسب ما يتوقعه ProductCard
                  sellers: service.service_providers 
                }} 
                allCategories={allCategories} 
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
