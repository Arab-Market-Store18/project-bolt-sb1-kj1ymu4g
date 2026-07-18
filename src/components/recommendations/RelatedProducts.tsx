"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MiniProductCard } from './MiniProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Store, RefreshCw, Info, TrendingUp, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

interface RelatedProductsProps {
  sellerId: string;
  currentProductId: string;
  sellerName: string;
  sellerLogoUrl?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
  discount_price?: number;
  images: string[] | null;
  thumbnail_image_url: string | null;
  category_id?: number;
  created_at?: string;
  likes_count?: number;
  sales_count?: number;
}

interface ApiResponse {
  success: boolean;
  data: Product[];
  stats?: {
    totalAvailable: number;
    withImages: number;
    withThumbnail: number;
    sameCategory: number;
  };
  message?: string;
}

export function RelatedProducts({ sellerId, currentProductId, sellerName, sellerLogoUrl }: RelatedProductsProps) {
  console.log("🔍 [RelatedProducts REAL] - بدأ:", {
    sellerId,
    currentProductId,
    sellerName
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [infoMessage, setInfoMessage] = useState<string>('');
  
  // 🔥 فقط أضف هذه الحقول الجديدة للتحكم في العرض
  const [visibleCount, setVisibleCount] = useState(6);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRelatedProducts = async () => {
    // ... (نفس الكود تماماً بدون تغيير)
    try {
      setIsLoading(true);
      setError(null);
      setStats(null);
      setInfoMessage('');
      
      const apiUrl = `/api/recommendations/related?sellerId=${sellerId}&currentProductId=${currentProductId}`;
      console.log("🔍 [API URL REAL]:", apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log("🔍 [API Response REAL]:", {
        ok: response.ok,
        status: response.status
      });
      
      if (!response.ok) {
        throw new Error(`فشل في جلب البيانات: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log("🔍 [API Data REAL]:", {
        success: data.success,
        productsCount: data.data?.length || 0,
        stats: data.stats,
        message: data.message
      });
      
      if (data.success) {
        setProducts(data.data || []);
        setStats(data.stats || null);
        setInfoMessage(data.message || '');
        
        console.log("🔍 [Products Loaded REAL]:", {
          count: data.data?.length || 0,
          firstProduct: data.data?.[0]
        });
      } else {
        setError(data.error || 'فشل في تحميل المنتجات');
      }
    } catch (err: any) {
      console.error("🔍 [Error REAL]:", err);
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // ... (نفس الكود تماماً بدون تغيير)
    console.log("🔍 [useEffect REAL] - تنفيذ:", {
      sellerId,
      currentProductId,
      hasSellerId: !!sellerId,
      hasProductId: !!currentProductId
    });
    
    if (sellerId && currentProductId) {
      fetchRelatedProducts();
    } else {
      console.warn("🔍 [useEffect REAL] - بيانات غير كافية");
      setIsLoading(false);
    }
  }, [sellerId, currentProductId]);

  // 🔥 أضف هذه الدوال الجديدة فقط
  const loadMoreProducts = () => {
    if (visibleCount + 3 <= products.length) {
      setVisibleCount(prev => prev + 3);
    } else {
      setVisibleCount(products.length);
    }
  };

  const showLessProducts = () => {
    setVisibleCount(6);
  };

  const showAllProducts = () => {
    setVisibleCount(products.length);
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // 🔥 حالة التحميل - تصميم واقعي (نفس الكود)
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            جاري تحميل منتجات {sellerName}...
          </h3>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-40 flex-shrink-0 space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🔥 حالة الخطأ (نفس الكود)
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-red-600">خطأ في التحميل</h3>
        <p className="text-sm text-gray-600">{error}</p>
        <Button 
          onClick={fetchRelatedProducts}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  // 🔥 حالة عدم وجود منتجات (نفس الكود)
  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">قد يعجبك من {sellerName}</h3>
        <div className="text-center py-8 text-gray-500">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>لا توجد منتجات أخرى من هذا المتجر حالياً</p>
          {stats && (
            <p className="text-sm mt-2">
              لدى التاجر {stats.totalAvailable} منتج نشط
            </p>
          )}
        </div>
      </div>
    );
  }

  // 🔥 المنتجات المعروضة حالياً (التعديل الوحيد هنا)
  const displayedProducts = products.slice(0, visibleCount);

  // 🔥 العرض النهائي - واقعي مع إحصائيات (مع تعديلات طفيفة فقط)
  return (
    <div className="space-y-4">
      {/* 🔥 العنوان مع الإحصائيات (نفس الكود) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-bold">قد يعجبك من {sellerName}</h3>
        </div>
        
        {stats && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            <span>
              يعرض {displayedProducts.length} من {stats.totalAvailable} منتج
            </span>
          </div>
        )}
      </div>

      {/* 🔥 معلومات واقعية إضافية (نفس الكود) */}
      {infoMessage && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>{infoMessage}</span>
          </div>
          {stats && (
            <div className="mt-2 text-xs text-blue-600 grid grid-cols-2 gap-2">
              <span>🖼️ {stats.withImages} منتج له صور</span>
              <span>📊 {stats.sameCategory} منتج في نفس الفئة</span>
            </div>
          )}
        </div>
      )}

      {/* 🔥 البطاقات الحقيقية (مع تعديلات بسيطة فقط) */}
      <div className="relative group">
        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto pb-6 -mr-4 pr-4 scrollbar-hide scroll-smooth"
        >
          {displayedProducts.map((product, index) => {
            const hasImages = product.images && product.images.length > 0;
            const isNew = product.created_at ? 
              (Date.now() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
            
            return (
              <div key={`${product.id}-${index}`} className="flex-shrink-0 w-40">
                <div className="relative">
                  {isNew && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        جديد
                      </span>
                    </div>
                  )}
                  {!hasImages && (
                    <div className="absolute top-2 right-2 z-10">
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                        بدون صور
                      </span>
                    </div>
                  )}
                  
                  <MiniProductCard product={product} seller={sellerLogoUrl ? { logo_url: sellerLogoUrl, business_name: sellerName } : null} />
                  
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {product.sales_count && product.sales_count > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{product.sales_count} مبيعاً</span>
                      </div>
                    )}
                    {product.likes_count && product.likes_count > 0 && (
                      <div className="flex items-center gap-1">
                        <span>❤️ {product.likes_count} إعجاب</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 🔥 أزرار التمرير (إضافة جديدة فقط) */}
        {displayedProducts.length > 4 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}
      </div>      
{products.length > 6 && (
  <div className="text-center">
    {visibleCount < products.length ? (
      <button
        onClick={showAllProducts}
        className="group px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-3 mx-auto shadow-sm hover:shadow border border-blue-200"
      >
        <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span>عرض كل المنتجات</span>
        <span className="bg-blue-200 px-2 py-0.5 rounded-full text-xs">
          {products.length}
        </span>
        <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </button>
    ) : (
      <button
        onClick={showLessProducts}
        className="group px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-3 mx-auto shadow-sm hover:shadow border border-gray-200"
      >
        <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span>العودة للعرض العادي</span>
        <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
          6 منتجات
        </span>
        <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
      </button>
    )}
  </div>
)}
    </div>
  );
}