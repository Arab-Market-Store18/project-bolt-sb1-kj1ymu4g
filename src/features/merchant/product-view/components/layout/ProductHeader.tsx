// features/merchant/product-view/components/layout/ProductHeader.tsx
/**
 * @component ProductHeader
 * @description مكون رأس صفحة المنتج - يعرض معلومات البائع مع خلفية مميزة
 * @role فصل واجهة رأس المنتج لتحسين إمكانية الصيانة وإعادة الاستخدام
 */
import React, { useMemo } from 'react';
import Image from "next/image";
import Link from "next/link"; // ✅ مرة واحدة
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Store, ExternalLink } from "lucide-react"; // ✅ مرة واحدة
import { SellerInfo } from '../../types/product.types';
import { getOptimizedMediaUrl } from "@/lib/utils/cloudinary";

interface ProductHeaderProps {
  seller: SellerInfo | null;
  isLoading?: boolean;
}

export function ProductHeader({ 
  seller, 
  isLoading = false 
}: ProductHeaderProps) {
  const router = useRouter();

  // إنشاء رابط الصفحة الشخصية للتاجر
  const sellerProfileUrl = seller?.id ? `/seller/${seller.id}` : '#';

  // تحسين الأداء: استخدام useMemo للصورة المحسنة
  const headerBackgroundImage = useMemo(() => {
    if (isLoading || !seller) {
      return '/placeholder-cover.jpg';
    }
    return getOptimizedMediaUrl(
      seller.store_image_url || seller.logo_url || '/placeholder-cover.jpg',
      'image',
      { width: 1200, height: 400, quality: 80 }
    );
  }, [seller, isLoading]);

  // استخراج الأحرف الأولى للـ Fallback
  const sellerInitials = useMemo(() => {
    if (!seller?.business_name) return 'T';
    return seller.business_name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [seller?.business_name]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/products');
    }
  };

  const navigateToSellerProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    if (seller?.id) {
      router.push(sellerProfileUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="relative p-4 border-b bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse">
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full text-center sm:text-right">
          <div className="h-16 w-16 rounded-full bg-gray-400"></div>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-400 rounded"></div>
            <div className="h-4 w-32 bg-gray-400 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header 
      role="banner"
      aria-label="رأس صفحة المنتج"
      className="relative p-4 border-b overflow-hidden min-h-[180px] md:min-h-[220px]"
    >
      {/* خلفية مع تحسينات الأداء */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-blue-900/70"
        aria-hidden="true"
      >
        {seller && (
          <Image
            src={headerBackgroundImage}
            alt={`خلفية متجر ${seller.business_name}`}
            fill
            className="object-cover opacity-40"
            sizes="100vw"
            priority
            quality={70}
            loading="eager"
          />
        )}
      </div>

      {/* طبقة Blur محسنة */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* زر العودة مع تحسينات إمكانية الوصول */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="absolute top-4 left-4 h-auto px-4 py-2 rounded-full z-20 
                 bg-white/90 dark:bg-gray-900/90 
                 text-gray-900 dark:text-gray-100 
                 hover:bg-white dark:hover:bg-gray-800 
                 flex items-center gap-2 shadow-lg
                 transition-all duration-200
                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="العودة للصفحة السابقة"
      >
        <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        <span className="font-medium">العودة</span>
      </Button>

      {/* محتوى الرأس الرئيسي */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full text-center sm:text-right pt-8 sm:pt-12">
        {/* صورة المتجر/الشعار - مع رابط */}
        <Link
          href={sellerProfileUrl}
          className="group relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
          aria-label={`زيارة متجر ${seller?.business_name}`}
          onClick={navigateToSellerProfile}
            prefetch={false} // 🔴 أضف هذا

        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-3 border-white/70 shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-105">
            {seller?.logo_url ? (
              <AvatarImage 
                src={seller.logo_url} 
                alt={`شعار ${seller.business_name}`}
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                <Store className="h-10 w-10 text-white" aria-hidden="true" />
              </div>
            )}
            <AvatarFallback className="text-2xl md:text-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
              {sellerInitials}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* معلومات البائع - اسم التاجر كرابط */}
        <div className="flex flex-col items-center sm:items-end space-y-2 max-w-2xl">
          {/* رابط اسم التاجر */}
          <Link
            href={sellerProfileUrl}
            onClick={navigateToSellerProfile}
            className="group inline-block"
            aria-label={`زيارة صفحة ${seller?.business_name}`}
              prefetch={false} // 🔴 أضف هذا

          >
            <div className="flex items-center gap-2 group">
              <h1 
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg text-center sm:text-right
                         group-hover:text-blue-200 transition-colors duration-200
                         underline decoration-transparent group-hover:decoration-white/50 decoration-2 underline-offset-4"
                itemProp="name"
              >
                {seller?.business_name || 'متجر'}
              </h1>
              <ExternalLink className="h-5 w-5 text-white/70 group-hover:text-white transition-colors duration-200" />
            </div>
          </Link>
          
          {seller?.store_description && (
            <p className="text-sm md:text-base text-white/90 max-w-md line-clamp-2 drop-shadow-sm">
              {seller.store_description}
            </p>
          )}

          {/* زر ملف التاجر */}
          <Link
            href={sellerProfileUrl}
            onClick={navigateToSellerProfile}
            className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full 
                     bg-white/20 hover:bg-white/30 text-white 
                     border border-white/30 hover:border-white/50
                     transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
            aria-label={`عرض ملف التاجر ${seller?.business_name}`}
              prefetch={false} // 🔴 أضف هذا

          >
            <span className="font-medium">عرض ملف التاجر</span>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* مؤشر التحميل/الحالة */}
      {seller?.is_verified && (
        <div className="absolute bottom-4 right-4 z-20">
          <div className="flex items-center gap-2 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            <span>تاجر موثوق</span>
          </div>
        </div>
      )}

      {/* تأثير تفاعلي للفأرة */}
      <div className="absolute inset-0 z-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      h-64 w-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                      rounded-full blur-3xl" />
      </div>
    </header>
  );
}