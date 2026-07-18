// المسار: features/service/service-view/components/layout/ServiceHeader.tsx
// -- الإصدار النهائي بعد التعديل --

"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ServiceProvider } from "../../types/service.types";

interface ServiceHeaderProps {
  provider: ServiceProvider | null;
  headerBackgroundImage: string | null;  // store_image_url
  onNavigateToProvider: () => void;
}

export const ServiceHeader = ({
  provider,
  headerBackgroundImage,
  onNavigateToProvider
}: ServiceHeaderProps) => {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  // أضف الـ console.log هنا 👇
  console.log('📦 ServiceHeader - البيانات:', {
    business_name: provider?.business_name,
    avatar_url: provider?.avatar_url,
    headerBackgroundImage: headerBackgroundImage,
    all_provider_data: provider
  });

  // صورة افتراضية للخلفية إذا لم توجد
  const backgroundImage = headerBackgroundImage || '/images/default-cover.jpg';

  return (
    <div
      className="relative p-4 sm:p-6 border-b overflow-hidden w-full"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* طبقة التعتيم */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* زر العودة */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="absolute top-4 left-4 h-auto px-3 sm:px-4 py-2 rounded-full z-20 bg-white text-black hover:bg-gray-200 flex items-center gap-1 sm:gap-2 shadow-md text-sm sm:text-base"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>العودة</span>
      </Button>

      {/* محتوى البانر - اسم وشعار مزود الخدمة */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 w-full text-center sm:text-right px-2">
        {/* شعار مزود الخدمة - من عمود avatar_url */}
        <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-white/50 shadow-lg">
        <AvatarImage src={provider?.logo_url || undefined} />          <AvatarFallback className="text-3xl bg-black/30 text-white">
            {provider?.business_name?.charAt(0) || 'م'}
          </AvatarFallback>
        </Avatar>
        
        {/* اسم مزود الخدمة - من عمود business_name */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-md">
            {provider?.business_name || 'مقدم الخدمة'}
          </h1>
          <p
            className="text-sm text-white/80 drop-shadow-sm cursor-pointer hover:underline"
            onClick={onNavigateToProvider}
          >
            عرض ملف مقدم الخدمة
          </p>
        </div>
      </div>
    </div>
  );
};