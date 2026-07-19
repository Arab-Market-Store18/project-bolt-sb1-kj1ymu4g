// components/recommendations/CrossSellPicks.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { MiniProductCard } from './MiniProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ?? تقسيم واجهات TypeScript
interface Seller {
  business_name: string;
  logo_url: string | null;
  rating?: number;
}

interface ProductStats {
  conversion_rate?: number;
  sales_count?: number;
  likes_count: number;
}

interface ProductBase {
  id: string;
  name: string;
  price: number;
  currency?: string;
  discount_price?: number;
  images: string[] | null;
  thumbnail_image_url: string | null;
  tags?: string[];
}

interface Product extends ProductBase {
  stats: ProductStats;
  seller: Seller;
}

interface CrossSellPicksProps {
  currentProductId: string;
  categoryId?: number;
  mainCategoryId?: number;
  className?: string;
}

// ?? مكونات فرعية مع memoization
const QualityIndicator = memo(({ conversionRate }: { conversionRate: number }) => (
  conversionRate > 70 ? (
    <div className="absolute top-2 left-2 z-10" aria-label="منتج عالي الجودة">
      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
        ?? {conversionRate}%
      </span>
    </div>
  ) : null
));

QualityIndicator.displayName = 'QualityIndicator';

const SellerInfo = memo(({ seller, stats }: { seller: Seller; stats: ProductStats }) => (
  <div className="mt-2 text-xs text-gray-500 space-y-1" aria-label="معلومات البائع">
    {seller && (
      <p className="truncate font-medium" title={seller.business_name}>
        {seller.business_name}
      </p>
    )}
    <div className="flex justify-between">
      {stats.conversion_rate && (
        <span className="text-green-600 font-medium">
          {stats.conversion_rate}% تحويل
        </span>
      )}
      {stats.sales_count && stats.sales_count > 0 && (
        <span className="text-blue-600">
          {stats.sales_count.toLocaleString()} مبيع
        </span>
      )}
    </div>
  </div>
));

SellerInfo.displayName = 'SellerInfo';

const ScrollButton = memo(({ 
  direction, 
  onClick, 
  isVisible 
}: { 
  direction: 'left' | 'right';
  onClick: () => void;
  isVisible: boolean;
}) => (
  <button
    onClick={onClick}
    aria-label={`تمرير ${direction === 'left' ? 'لليسار' : 'لليمين'}`}
    className={cn(
      "absolute top-1/2 -translate-y-1/2 bg-white/95 p-3 rounded-full shadow-lg border",
      "transition-all duration-200 z-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
      "hover:scale-105 active:scale-95",
      direction === 'left' ? 'left-2' : 'right-2',
      isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
    )}
  >
    {direction === 'left' ? (
      <ChevronRight className="h-5 w-5 text-gray-700" aria-hidden="true" />
    ) : (
      <ChevronLeft className="h-5 w-5 text-gray-700" aria-hidden="true" />
    )}
  </button>
));

ScrollButton.displayName = 'ScrollButton';

const ProgressIndicator = memo(({ 
  current, 
  total 
}: { 
  current: number; 
  total: number 
}) => (
  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
    <div className="flex items-center gap-2">
      <div className="w-32 bg-gray-200 rounded-full h-2" aria-hidden="true">
        <div 
          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
          aria-label={`عرض ${current} من ${total} منتج`}
        />
      </div>
      <span aria-live="polite">
        {current.toLocaleString()}/{total.toLocaleString()}
      </span>
    </div>
  </div>
));

ProgressIndicator.displayName = 'ProgressIndicator';

const ProductCardWrapper = memo(({ 
  product, 
  isExpanded 
}: { 
  product: Product; 
  isExpanded: boolean 
}) => (

  // Container div - السطر 272
// ProductCardWrapper - السطر 139
<div 
  className={cn(
    "flex-shrink-0 transition-all duration-200",
    isExpanded 
      ? "w-full" 
      : "w-28 xs:w-32 sm:w-36 md:w-40 lg:w-44"
  )}
>
    <div className="relative group/card">
      <QualityIndicator conversionRate={product.stats.conversion_rate || 0} />
      <MiniProductCard product={product} />
      <SellerInfo seller={product.seller} stats={product.stats} />
    </div>
  </div>
));

ProductCardWrapper.displayName = 'ProductCardWrapper';

// ?? المكون الرئيسي
export function CrossSellPicks({ 
  currentProductId, 
  categoryId, 
  mainCategoryId,
  className 
}: CrossSellPicksProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ?? AbortController لإلغاء الطلبات غير الضرورية
  const abortControllerRef = useRef<AbortController | null>(null);

  // ?? استخدام useCallback للدوال
  const fetchCrossSellPicks = useCallback(async () => {
    // إلغاء الطلب السابق إن وجد
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      setError(null);
      
      let url = `/api/recommendations/cross-sell?currentProductId=${currentProductId}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (mainCategoryId) url += `&mainCategoryId=${mainCategoryId}`;
      
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: {
          'Cache-Control': 'max-age=300', // cache لمدة 5 دقائق
        }
      });
      
      if (!response.ok) {
        throw new Error(`خطأ في جلب البيانات: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // ?? تحويل البيانات إلى الهيكل الجديد
        const formattedProducts: Product[] = (data.data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          currency: item.currency,
          discount_price: item.discount_price,
          images: item.images,
          thumbnail_image_url: item.thumbnail_image_url,
          tags: item.tags,
          stats: {
            conversion_rate: item.conversion_rate,
            sales_count: item.sales_count,
            likes_count: item.likes_count
          },
          seller: item.sellers
        }));
        
        setProducts(formattedProducts);
      } else {
        setError(data.message || 'حدث خطأ في جلب البيانات');
      }
    } catch (err: any) {
      // تجاهل الأخطاء الناتجة عن الإلغاء
      if (err.name === 'AbortError') {
        console.log('تم إلغاء طلب جلب البيانات');
        return;
      }
      console.error('خطأ في جلب المنتجات:', err);
      setError('تعذر تحميل المنتجات المقترحة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [currentProductId, categoryId, mainCategoryId]);

  // ?? دالة التحديث
  const handleRefresh = useCallback(() => {
    fetchCrossSellPicks();
  }, [fetchCrossSellPicks]);

  useEffect(() => {
    if (currentProductId) {
      fetchCrossSellPicks();
    }

    // تنظيف عند unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentProductId, categoryId, mainCategoryId, fetchCrossSellPicks]);

  // ?? التحكم في ظهور أزرار التمرير
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const hasHorizontalScroll = container.scrollWidth > container.clientWidth;
      setShowScrollButtons(hasHorizontalScroll);
    };

    // التحقق الأولي
    handleScroll();

    // إضافة مستمع لحدث resize
    window.addEventListener('resize', handleScroll);
    container.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleScroll);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [products.length, isExpanded]);

  const scrollLeft = useCallback(() => {
    containerRef.current?.scrollBy({ 
      left: -300, 
      behavior: 'smooth' 
    });
  }, []);

  const scrollRight = useCallback(() => {
    containerRef.current?.scrollBy({ 
      left: 300, 
      behavior: 'smooth' 
    });
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // ?? تحديد المنتجات المعروضة
  const displayCount = isExpanded ? products.length : Math.min(20, products.length);
  const displayedProducts = products.slice(0, displayCount);
  const additionalProducts = products.length > 20 ? products.length - 20 : 0;

  // ?? Skeleton loader محسن
  // ?? Skeleton loader محسن
  if (isLoading) {
    return (
      <div className={cn("space-y-4 mt-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-bold">اخترنا لك</h3>
          </div>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-32">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ?? عرض رسالة الخطأ
  if (error) {
    return (
      <div className={cn("space-y-4 mt-8", className)}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-bold text-red-800">خطأ في تحميل الاقتراحات</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-3 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            المحاولة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0 && !isLoading && !error) {
    return null;
  }

  return (
    <section 
      className={cn("space-y-6 mt-8", className)}
      aria-label="منتجات مقترحة لك"
    >
      {/* ?? العنوان مع الأزرار */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-purple-500" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-bold">اخترنا لك</h2>
            <p className="text-sm text-gray-500">
              {displayedProducts.length} من {products.length} منتج مقترح
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
            aria-label="تحديث الاقتراحات"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          
          {additionalProducts > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleExpand}
              className="gap-2"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "عرض عدد أقل من المنتجات" : `عرض ${additionalProducts} منتج إضافي`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  عرض أقل (20 منتج)
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  عرض المزيد (+{additionalProducts})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* ?? البطاقات مع تحسينات العرض */}
      <div className="relative group/container">
      <div 
  ref={containerRef}
  className={cn(
    "flex gap-2 xs:gap-3 sm:gap-4 pb-4 sm:pb-6 pr-3 sm:pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
    "scroll-smooth overflow-x-auto",
    isExpanded 
      ? "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 overflow-visible" 
      : "flex"
  )}

          style={{ 
            maxHeight: isExpanded ? 'none' : '500px',
            overflowY: isExpanded ? 'visible' : 'hidden'
          }}
          aria-live="polite"
          aria-label="قائمة المنتجات المقترحة"
        >
          {displayedProducts.map((product) => (
            <ProductCardWrapper 
              key={product.id} 
              product={product} 
              isExpanded={isExpanded} 
            />
          ))}
        </div>
        
        {/* ?? أزرار التمرير - تظهر فقط عند الحاجة */}
        {!isExpanded && displayedProducts.length > 4 && (
          <>
            <ScrollButton 
              direction="left" 
              onClick={scrollLeft} 
              isVisible={showScrollButtons}
            />
            <ScrollButton 
              direction="right" 
              onClick={scrollRight} 
              isVisible={showScrollButtons}
            />
          </>
        )}
      </div>

      {/* ?? مؤشر التقدم والتوضيحات */}
      {products.length > 20 && (
        <div className="space-y-3">
          <ProgressIndicator current={displayedProducts.length} total={products.length} />
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>?? = معدل تحويل عالي (&gt;70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>?? = مبيعات عالية</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(CrossSellPicks);