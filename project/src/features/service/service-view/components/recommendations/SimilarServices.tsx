// المسار: src/features/service/service-view/components/recommendations/SimilarServices.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback, memo, useTransition } from 'react';
import { MiniServiceCard } from './MiniServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Layers, RefreshCw, Filter, ChevronLeft, ChevronRight, Target, Clock, DollarSign, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSimilarServicesAction } from '../../../actions/getSimilarServices.action';

// واجهة Service للتوافق مع البيانات القادمة
interface Service {
  id: string;
  title: string;
  base_price: number;
  thumbnail_image_url?: string | null;
  delivery_time_days?: number;
  is_featured?: boolean;
  created_at?: string;
  provider?: {
    id: string;
    business_name: string;
    is_verified?: boolean;
  } | null;
  stats?: {
    avg_rating: number;
    review_count: number;
  } | null;
  // تمت إضافة هذه الخصائص لتجنب أخطاء النوع
  description?: string;
  currency?: string;
  discounted_price?: number;
  images?: string[] | null;
  tags?: string[];
  is_verified?: boolean;
  category?: {
    id: number;
    name: string;
  };
}

interface SimilarServicesProps {
  serviceId: string;
  categoryId?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  className?: string;
}

interface FilterState {
  sortBy: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'delivery';
  priceRange: {
    min: number;
    max: number;
  };
  deliveryTime: number | null;
  onlyVerified: boolean;
  onlyFeatured: boolean;
}

const SimilarServices = memo(({ 
  serviceId, 
  categoryId, 
  priceRange,
  className 
}: SimilarServicesProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'relevance',
    priceRange: priceRange || { min: 0, max: 10000 },
    deliveryTime: null,
    onlyVerified: false,
    onlyFeatured: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSimilarServices = useCallback(() => {
    if (!categoryId) {
      setError("Category ID is required to find similar services.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await getSimilarServicesAction({
        serviceId,
        categoryId,
        sortBy: filters.sortBy,
        minPrice: filters.priceRange.min,
        maxPrice: filters.priceRange.max,
        deliveryTime: filters.deliveryTime,
        onlyVerified: filters.onlyVerified,
        onlyFeatured: filters.onlyFeatured,
        limit: 12,
      });

      if (result.success) {
        setServices(result.data as Service[]);
      } else {
        console.error('Error fetching similar services:', result.error);
        setError(result.error || 'Failed to load similar services.');
      }
    });
  }, [serviceId, categoryId, filters]);

  useEffect(() => {
    if (serviceId && categoryId) {
      fetchSimilarServices();
    }
  }, [fetchSimilarServices, serviceId, categoryId]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchSimilarServices();
  }, [fetchSimilarServices]);

  const resetFilters = useCallback(() => {
    setFilters({
      sortBy: 'relevance',
      priceRange: priceRange || { min: 0, max: 10000 },
      deliveryTime: null,
      onlyVerified: false,
      onlyFeatured: false
    });
  }, [priceRange]);

  const scrollLeft = useCallback(() => {
    containerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    containerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  }, []);

  if (isPending && services.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-bold">خدمات مشابهة</h2>
              <p className="text-sm text-gray-500">جاري البحث عن خدمات مشابهة...</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="w-72 flex-shrink-0 space-y-3">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-bold text-red-800">خطأ في تحميل الخدمات المتشابهة</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4 gap-2" disabled={isPending}>
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            المحاولة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  if (!isPending && services.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Layers className="h-12 w-12 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-blue-800">لا توجد خدمات مشابهة</h3>
          <p className="text-blue-600 mt-2">لم نتمكن من العثور على خدمات مشابهة في الوقت الحالي.</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4 gap-2" disabled={isPending}>
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            البحث مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-purple-500" />
          <div>
            <h2 className="text-xl font-bold">خدمات مشابهة</h2>
            <p className="text-sm text-gray-500">
              {isPending ? 'جاري التحديث...' : `تم العثور على ${services.length} خدمة`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="h-4 w-4" />
            {showFilters ? 'إخفاء الفلاتر' : 'تصفية'}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2" disabled={isPending}>
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            {isPending ? 'جاري...' : 'تحديث'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-700">تصفية النتائج</h3>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm" disabled={isPending}>
              إعادة الضبط
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب حسب</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={isPending}
              >
                <option value="relevance">الأكثر صلة</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="price_low">السعر: من الأقل للأعلى</option>
                <option value="price_high">السعر: من الأعلى للأقل</option>
                <option value="delivery">الأسرع تسليماً</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نطاق السعر</label>
              <div className="flex items-center gap-2">
                <input type="number" value={filters.priceRange.min} onChange={(e) => handleFilterChange('priceRange', {...filters.priceRange, min: parseInt(e.target.value) || 0})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="الأدنى" disabled={isPending} />
                <span>-</span>
                <input type="number" value={filters.priceRange.max} onChange={(e) => handleFilterChange('priceRange', {...filters.priceRange, max: parseInt(e.target.value) || 10000})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="الأقصى" disabled={isPending} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت التسليم (أيام)</label>
              <input type="number" value={filters.deliveryTime || ''} onChange={(e) => handleFilterChange('deliveryTime', e.target.value ? parseInt(e.target.value) : null)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="أي عدد" disabled={isPending} />
            </div>

            <div className="space-y-3 pt-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="onlyVerified" checked={filters.onlyVerified} onChange={(e) => handleFilterChange('onlyVerified', e.target.checked)} className="rounded border-gray-300" disabled={isPending} />
                <label htmlFor="onlyVerified" className="text-sm text-gray-700">موفرين معتمدين</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="onlyFeatured" checked={filters.onlyFeatured} onChange={(e) => handleFilterChange('onlyFeatured', e.target.checked)} className="rounded border-gray-300" disabled={isPending} />
                <label htmlFor="onlyFeatured" className="text-sm text-gray-700">خدمات مميزة</label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative group">
        <div ref={containerRef} className="flex gap-4 overflow-x-auto pb-6 pr-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scroll-smooth">
          {services.map((service) => (
            <div key={service.id} className="flex-shrink-0 w-72 transform transition-transform hover:scale-[1.02]">
              <MiniServiceCard service={service} />
            </div>
          ))}
        </div>
        
        {services.length > 4 && (
          <>
            <button onClick={scrollLeft} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:opacity-50" disabled={isPending}><ChevronRight className="h-5 w-5 text-gray-700" /></button>
            <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:opacity-50" disabled={isPending}><ChevronLeft className="h-5 w-5 text-gray-700" /></button>
          </>
        )}
      </div>

      {services.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><Target className="h-5 w-5 text-purple-500" /><span className="font-bold text-lg text-gray-900">{services.length}</span></div>
              <p className="text-sm text-gray-600">خدمة مشابهة</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><Star className="h-5 w-5 text-yellow-500" /><span className="font-bold text-lg text-gray-900">{Math.max(...services.map(s => s.stats?.avg_rating || 0)).toFixed(1)}</span></div>
              <p className="text-sm text-gray-600">أعلى تقييم</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><Clock className="h-5 w-5 text-green-500" /><span className="font-bold text-lg text-gray-900">{Math.min(...services.filter(s => s.delivery_time_days).map(s => s.delivery_time_days!))}</span></div>
              <p className="text-sm text-gray-600">أسرع تسليم (يوم)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-blue-500" /><span className="font-bold text-lg text-gray-900">{Math.min(...services.map(s => s.discounted_price || s.base_price)).toLocaleString()}</span></div>
              <p className="text-sm text-gray-600">أقل سعر</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

SimilarServices.displayName = 'SimilarServices';

export { SimilarServices };
