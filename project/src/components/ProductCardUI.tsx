// المسار: components/ProductCardUI.tsx
// -- النسخة المعدلة: تم تبسيط الأزرار وتغيير سلوك النقر --

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// استيراد ديناميكي للأيقونات
const HeartIcon = React.lazy(() => import('lucide-react').then(module => ({ default: module.Heart })));
const Eye = React.lazy(() => import('lucide-react').then(module => ({ default: module.Eye })));
const Users = React.lazy(() => import('lucide-react').then(module => ({ default: module.Users })));
const Loader2 = React.lazy(() => import('lucide-react').then(module => ({ default: module.Loader2 })));
const Tag = React.lazy(() => import('lucide-react').then(module => ({ default: module.Tag })));
// ✅ إضافة أيقونات جديدة
const Edit = React.lazy(() => import('lucide-react').then(module => ({ default: module.Edit })));
const Share2 = React.lazy(() => import('lucide-react').then(module => ({ default: module.Share2 })));

interface PriceDetails {
  currentPrice: string;
  oldPrice: string | null;
  discountPercentage: number | null;
}

interface ProductCardUIProps {
  mainCategoryName: string | null;
  subCategoryName: string | null;
  sortedCategories?: string[];
  productId: string;
  productName: string;
  sellerName?: string;
  sellerLogoUrl?: string;
  followersCount?: number;
  likesCount: number;
  priceDetails: PriceDetails;
  images: string[];
  isLiked: boolean;
  isLiking: boolean;
  currentImageIndex: number;
  highlighted: boolean;
  onLikeClick: (e: React.MouseEvent) => void;
  onDetailsClick: (e: React.MouseEvent) => void;
  onSellerProfileClick: (e: React.MouseEvent) => void;
  onFollowersClick: (e: React.MouseEvent) => void;
  onImageIndicatorClick: (e: React.MouseEvent, index: number) => void;
  onImageLoad: () => void;
  isPriority?: boolean;
  // ▼▼▼ الإضافة الجديدة ▼▼▼
  onCardClick: (e: React.MouseEvent) => void;
  // ✅ إضافة props جديدة
  onEditClick?: (e: React.MouseEvent) => void;
  onShareClick?: (e: React.MouseEvent) => void;
  context?: 'store' | 'dashboard';
  viewMode?: 'grid' | 'list';
}

const ProductCardUIComponent = React.forwardRef<HTMLDivElement, ProductCardUIProps>(({
  mainCategoryName,
  subCategoryName,
  sortedCategories,
  productId,
  productName,
  sellerName,
  sellerLogoUrl,
  followersCount,
  likesCount,
  priceDetails,
  images,
  isLiking,

  isLiked,
  currentImageIndex,
  highlighted,
  onLikeClick,
  onDetailsClick,
  onSellerProfileClick,
  onFollowersClick,
  onImageIndicatorClick,
  onImageLoad,
  isPriority,
  // ▼▼▼ الإضافة الجديدة ▼▼▼
  onCardClick,
  // ✅ إضافة الخصائص الجديدة
  onEditClick,
  onShareClick,
  viewMode = 'grid',
  context = 'store',
}, ref) => {

  const currentImageUrl = images[currentImageIndex] || "/placeholder.svg";
  const originalLogoUrl = sellerLogoUrl || undefined;

  const displayCategories = sortedCategories && sortedCategories.length > 0 
    ? sortedCategories 
    : [mainCategoryName, subCategoryName].filter(Boolean);

  return (
    <div 
      ref={ref}
      data-product-id={productId}
      // ▼▼▼ تطبيق دالة النقر على البطاقة الرئيسية ▼▼▼
      onClick={onCardClick}
      className={`transition-all duration-500 cursor-pointer ${highlighted ? 'ring-4 ring-offset-2 ring-blue-500' : ''}`}
    >
      <div 
className={`group ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row w-full'} overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 dark:bg-gray-900`}
dir="rtl"
        style={viewMode === 'grid' 
          ? { '--card-width': '220px', '--card-height': '420px', width: 'var(--card-width)', height: 'var(--card-height)' } as React.CSSProperties
          : { '--card-width': '100%', '--card-height': 'auto', width: 'var(--card-width)', height: 'var(--card-height)' } as React.CSSProperties
        }      >
        {/* قسم الصورة */}
        <div 
          className={`relative ${viewMode === 'grid' ? 'h-60 w-full' : 'h-40 w-40 flex-shrink-0'} touch-pan-y`}
        >
           <div className="relative h-full w-full overflow-hidden p-2">
            <Image 
              key={productId + '-' + currentImageIndex}
              src={currentImageUrl}
              alt={productName || "صورة المنتج"} 
              fill 
              sizes="(max-width: 640px) 50vw, 220px"
              className="object-cover transition-transform duration-300"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIwIiBoZWlnaHQ9IjIwOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJibHVyRmlsdGVyIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI1IiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMGUwZTAiIGZpbHRlcj0idXJsKCNibHVyRmlsdGVyKSIvPjwvc3ZnPg=="
              onLoad={onImageLoad}
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith("/placeholder.svg")) {
                  target.src = "/placeholder.svg";
                }
                onImageLoad();
              }} 
              priority={isPriority}
            />
          </div>
       
          {priceDetails.discountPercentage && priceDetails.discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold p-1.5 rounded-md shadow-lg z-10 flex flex-col items-center justify-center leading-tight">
              <React.Suspense fallback={<div className="h-4 w-4 bg-white/20 rounded-sm"></div>}>
                <Tag className="h-4 w-4 mb-0.5" />
              </React.Suspense>
              <span>خصم {priceDetails.discountPercentage}%</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex flex-col gap-2">
<button onClick={onLikeClick} className={`rounded-full p-2 transition-all duration-200 ${isLiked ? "bg-red-500 text-white" : "bg-white/90 text-gray-700 shadow-sm"} hover:scale-105 active:scale-95`} title={isLiked ? "إزالة الإعجاب" : "إعجاب"}>
  <React.Suspense fallback={<div className="h-4 w-4 bg-gray-300 rounded"></div>}>
    <HeartIcon className={`h-4 w-4 transition-all duration-300 ${isLiked ? "fill-current scale-110" : ""}`} />
  </React.Suspense>
</button>
            {/* --- تم حذف أيقونة الفيديو من هنا --- */}
          </div>

          {images.length > 1 && (
  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
    {images.slice(0, 2).map((_, index) => (
      <button key={index} onClick={(e) => onImageIndicatorClick(e, index)} 
        className={`h-2 w-2 rounded-full transition-all duration-200 ${index === currentImageIndex ? "bg-gray-800 shadow-lg scale-125 dark:bg-white" : "bg-gray-500/60 hover:bg-gray-500/80"}`} 
        aria-label={`عرض الصورة ${index + 1}`} 
      />
    ))}
 
  </div>
)}
        </div>

        {/* قسم المحتوى */}
        <div className={`${viewMode === 'grid' ? 'flex flex-1 flex-col justify-between p-3 pt-1' : 'flex-1 p-3 pt-1'}`}>
          
          {sellerName && (
            <div className="mb-1 flex flex-col items-stretch gap-1">
              <div
                className="flex w-full min-w-0 items-center gap-2 transition-transform duration-200 group-hover:scale-105"
                onClick={onSellerProfileClick}
                title={`عرض ملف ${sellerName}`}
              >
                <Avatar className="h-7 w-7 flex-shrink-0 border-2 border-white shadow-sm">
                  <AvatarImage src={originalLogoUrl} alt={`شعار ${sellerName}`} className="rounded-full object-cover" />
                  <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">{sellerName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="block whitespace-nowrap text-xs font-semibold text-gray-800 dark:text-gray-200 transition-all duration-300 group-hover:bg-sea-gradient group-hover:text-transparent group-hover:bg-clip-text group-hover:animate-background-pan" style={{ backgroundSize: "200%" }}>
                  {sellerName}
                </span>
              </div>

              <div 
                className="flex self-end flex-shrink-0 cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
                onClick={onFollowersClick}
                title="عرض المتابعين"
              >
                <React.Suspense fallback={<div className="h-3.5 w-3.5 bg-gray-300 rounded"></div>}>
                  <Users className="h-3.5 w-3.5" />
                </React.Suspense>
                <span>{followersCount ?? 0}</span>
              </div>
            </div>
          )}
     
          <div className="mb-1 w-full overflow-hidden p-1.5">
            <h3 
              title={productName} 
              className="whitespace-nowrap text-xs leading-tight text-start font-semibold text-gray-800 dark:text-gray-200 rtl:text-right ltr:text-left"
              dir="auto"
            >
              {productName}
            </h3>
          </div>
          
          <div className="flex items-center justify-between mb-1">
            <div className="flex-grow overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div className="flex flex-col">
                <span className={`block whitespace-nowrap text-base font-bold ${priceDetails.oldPrice ? 'text-red-600' : 'text-emerald-600'}`}>
                  {priceDetails.currentPrice}
                </span>
                {priceDetails.oldPrice && (
                  <span className="block whitespace-nowrap text-xs text-gray-500 line-through -mt-1">
                    {priceDetails.oldPrice}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500" dir="ltr">
              <React.Suspense fallback={<div className="h-3.5 w-3.5 bg-red-200 rounded"></div>}>
                <HeartIcon className="h-3.5 w-3.5 text-red-400" />
              </React.Suspense>
              <span className="text-xs font-medium text-gray-600">{likesCount}</span>
            </div>
          </div>

          {displayCategories.length > 0 && (
            <div className="mb-1 flex w-full min-h-[18px] items-center gap-1 overflow-hidden whitespace-nowrap text-[11px] text-gray-500">
              {mainCategoryName && <span>{mainCategoryName}</span>}
              {subCategoryName && mainCategoryName !== subCategoryName && (
                <>
                  <span className="text-gray-400">/</span>
                  <span>{subCategoryName}</span>
                </>
              )}
            </div>
          )}

          {/* ▼▼▼ قسم الأزرار المعدل ▼▼▼ */}
          <div className="mt-auto flex gap-2 pt-1">
            {context === 'dashboard' ? (
              // ✅ في لوحة التحكم: زرين منفصلين
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8"
                  onClick={onEditClick}
                >
                  <React.Suspense fallback={<div className="h-3.5 w-3.5 bg-gray-300 rounded"></div>}>
                    <Edit className="ml-1 h-3.5 w-3.5" />
                  </React.Suspense>
                  <span>تعديل</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8"
                  onClick={onShareClick}
                >
                  <React.Suspense fallback={<div className="h-3.5 w-3.5 bg-gray-300 rounded"></div>}>
                    <Share2 className="ml-1 h-3.5 w-3.5" />
                  </React.Suspense>
                  <span>مشاركة</span>
                </Button>
              </>
            ) : (
              // في المتجر: زر واحد (كما هو)
              <Button variant="outline" size="sm" className="w-full h-8" onClick={onDetailsClick}>
                <React.Suspense fallback={<div className="ml-1 h-3.5 w-3.5 bg-gray-300 rounded"></div>}>
                  <Eye className="ml-1 h-3.5 w-3.5" />
                </React.Suspense>
                <span>التفاصيل و التواصل</span>
              </Button>
            )}
          </div>
          {/* ▲▲▲ نهاية قسم الأزرار المعدل ▲▲▲ */}
        </div>
      </div>
    </div>
  );
});

const arePropsEqual = (prevProps: ProductCardUIProps, nextProps: ProductCardUIProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.currentImageIndex === nextProps.currentImageIndex &&
    prevProps.currentImageIndex === nextProps.currentImageIndex &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.isLiking === nextProps.isLiking &&
    prevProps.highlighted === nextProps.highlighted &&
    prevProps.likesCount === nextProps.likesCount &&
    prevProps.images.length === nextProps.images.length &&
    prevProps.priceDetails.currentPrice === nextProps.priceDetails.currentPrice &&
    prevProps.priceDetails.oldPrice === nextProps.priceDetails.oldPrice &&
    prevProps.priceDetails.discountPercentage === nextProps.priceDetails.discountPercentage &&
    prevProps.sellerName === nextProps.sellerName &&
    prevProps.sellerLogoUrl === nextProps.sellerLogoUrl &&
    prevProps.followersCount === nextProps.followersCount
  );
};

export const ProductCardUI = React.memo(ProductCardUIComponent, arePropsEqual);
ProductCardUI.displayName = 'ProductCardUI';