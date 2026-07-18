// المسار: src/features/service/service-view/components/recommendations/RelatedServices.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MiniServiceCard } from './MiniServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Briefcase, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRelatedServicesAction } from '../../actions/getRelatedServices.action';

interface RelatedServicesProps {
  providerId: string;
  currentServiceId: string;
  providerName: string;
}

export function RelatedServices({ 
  providerId, 
  currentServiceId, 
  providerName 
}: RelatedServicesProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);  // ✅ إضافة هذا السطر

  const [visibleCount, setVisibleCount] = useState(6);
  const containerRef = useRef<HTMLDivElement>(null);
  console.log('🔍 [Client] RelatedServices بدأ:', {
    providerId,
    currentServiceId,
    providerName,
    hasProviderId: !!providerId,
    hasCurrentServiceId: !!currentServiceId
  });
  const fetchRelatedServices = async () => {
    console.log('🔍 [Client] fetchRelatedServices تنفيذ');
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [Client] استدعاء Server Action...');
      
      // استدعاء مباشر بدون useTransition
      const result = await getRelatedServicesAction({
        providerId,
        currentServiceId,
        limit: 12
      });
      
      console.log('🔍 [Client] نتيجة Server Action:', {
        success: result.success,
        dataLength: result.data?.length,
        error: result.error
      });
      
      if (result.success) {
        setServices(result.data || []);
        //setStats(result.stats || null);
      } else {
        setError(result.error || 'فشل في تحميل الخدمات');
      }
    } catch (err: any) {
      console.error("🔍 [Client] خطأ في جلب الخدمات:", err);
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId && currentServiceId) {
      fetchRelatedServices();
    }
  }, [providerId, currentServiceId]);

  // دوال التحكم في العرض
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

  const loadMoreServices = () => {
    if (visibleCount + 3 <= services.length) {
      setVisibleCount(prev => prev + 3);
    } else {
      setVisibleCount(services.length);
    }
  };

  const showLessServices = () => {
    setVisibleCount(6);
  };

  const showAllServices = () => {
    setVisibleCount(services.length);
  };

  // حالة التحميل
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-500" />
          قد يعجبك من {providerName}
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, index) => (
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

  // حالة الخطأ
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">قد يعجبك من {providerName}</h3>
        <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg">
          <p className="mb-2">{error}</p>
          <Button 
            onClick={fetchRelatedServices}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // حالة عدم وجود خدمات
  if (services.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">قد يعجبك من {providerName}</h3>
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>لا توجد خدمات أخرى من هذا المقدم حالياً</p>
        </div>
      </div>
    );
  }

  // الخدمات المعروضة حالياً
  const displayedServices = services.slice(0, visibleCount);

  // دالة تنسيق الأرقام
  const formatNumber = (num: number): string => {
    return num?.toLocaleString('ar-SA') || '0';
  };

  return (
    <div className="space-y-4">
      {/* العنوان */}
      <h3 className="text-lg font-bold">قد يعجبك من {providerName}</h3>

      {/* البطاقات */}
      <div className="relative">
        <div 
          ref={containerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        >
          {displayedServices.map((service) => {
            const hasImages = service.images && service.images.length > 0;
            const isNew = service.created_at ? 
              (Date.now() - new Date(service.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
            
            return (
              <div key={service.id} className="flex-shrink-0 w-40">
                <div className="relative">
                  {isNew && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        جديد
                      </span>
                    </div>
                  )}
                  
                  <MiniServiceCard 
                    service={{
                      id: service.id,
                      title: service.title || 'خدمة بدون عنوان',
                      description: service.description,
                      base_price: service.base_price || service.price || 0,
                      currency: service.currency || 'ر.س',
                      discounted_price: service.discounted_price || service.discount_price,
                      thumbnail_image_url: service.thumbnail_image_url,
                      images: service.images,
                      delivery_time_days: 7,
                      is_featured: service.is_featured || false,
                      is_verified: false,
                      stats: {
                        avg_rating: 0,
                        review_count: 0,
                        completed_orders: service.completed_orders || 0,
                        like_count: service.likes_count || 0
                      },
                      provider: service.provider || service.service_providers
                    }} 
                  />
                  
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {service.completed_orders && service.completed_orders > 0 && (
                      <div className="flex items-center gap-1">
                        <span>✅ {formatNumber(service.completed_orders)} طلب مكتمل</span>
                      </div>
                    )}
                    {service.likes_count && service.likes_count > 0 && (
                      <div className="flex items-center gap-1">
                        <span>❤️ {formatNumber(service.likes_count)} إعجاب</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* أزرار التمرير */}
        {displayedServices.length > 3 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg border opacity-70 hover:opacity-100 transition-opacity z-10"
              aria-label="تمرير لليسار"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg border opacity-70 hover:opacity-100 transition-opacity z-10"
              aria-label="تمرير لليمين"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}
      </div>
      
      {/* أزرار التحكم */}
      {services.length > 6 && (
        <div className="flex justify-center gap-2">
          {visibleCount < services.length ? (
            <>
              <Button
                onClick={loadMoreServices}
                variant="outline"
                size="sm"
              >
                عرض المزيد
              </Button>
              <Button
                onClick={showAllServices}
                variant="outline"
                size="sm"
              >
                عرض الكل ({services.length})
              </Button>
            </>
          ) : (
            <Button
              onClick={showLessServices}
              variant="outline"
              size="sm"
            >
              عرض أقل
            </Button>
          )}
        </div>
      )}
    </div>
  );
}