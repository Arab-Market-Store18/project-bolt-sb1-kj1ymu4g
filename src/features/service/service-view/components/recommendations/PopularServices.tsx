// src/features/service/service-view/components/recommendations/PopularServices.tsx
"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { MiniServiceCard } from './MiniServiceCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw, Filter, Award, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPopularServices } from '../../actions/getPopularServices.action';

interface ServiceProvider {
  id: string;
  business_name: string;
  logo_url?: string | null;
  rating?: number;
  location?: string;
  is_verified?: boolean;
}

interface ServiceCategory {
  id: number;
  name: string;
  slug?: string;
}

interface ServiceStats {
  avg_rating: number;
  review_count: number;
  completed_orders?: number;
  views_count?: number;
  likes_count?: number;
}

interface Service {
  id: string;
  title: string;
  description?: string;
  base_price: number;
  currency?: string;
  discounted_price?: number;
  thumbnail_image_url?: string | null;
  images?: string[] | null;
  tags?: string[];
  delivery_time_days?: number;
  is_featured?: boolean;
  is_verified?: boolean;
  created_at?: string;
  category?: ServiceCategory;
  provider?: ServiceProvider;
  stats: ServiceStats;
}

interface PopularServicesProps {
  categoryId?: number;
  limit?: number;
  className?: string;
  showFilters?: boolean;
}

const ServiceSkeleton = memo(({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="space-y-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    ))}
  </div>
));
ServiceSkeleton.displayName = 'ServiceSkeleton';

const FilterChips = memo(({ 
  activeFilter, 
  onFilterChange 
}: { 
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) => {
  const filters = [
    { id: 'all', label: 'جميع الخدمات', icon: TrendingUp },
    { id: 'featured', label: 'المميزة', icon: Award },
    { id: 'fast', label: 'الأسرع', icon: Clock },
    { id: 'top', label: 'الأعلى تقييماً', icon: Star },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              activeFilter === filter.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Icon className="h-4 w-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
});
FilterChips.displayName = 'FilterChips';

export function PopularServices({ 
  categoryId, 
  limit = 12, 
  className,
  showFilters = true
}: PopularServicesProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, featured: 0, verified: 0 });

  const fetchPopularServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getPopularServices({
        limit,
        categoryId,
        filter: activeFilter,
      });
      
      if (data.success) {
        setServices(data.data as Service[]);
        setStats({
          total: data.stats?.total || 0,
          featured: 0, // You might need to adjust stats calculation in the action
          verified: 0,
        });
      } else {
        setError(data.message || 'حدث خطأ في جلب البيانات');
      }
    } catch (err: any) {
      console.error('خطأ في جلب الخدمات الشائعة:', err);
      setError('تعذر تحميل الخدمات الشائعة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, limit, activeFilter]);

  useEffect(() => {
    fetchPopularServices();
  }, [fetchPopularServices]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchPopularServices();
  }, [fetchPopularServices]);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-bold">الخدمات الشائعة</h2>
              <p className="text-sm text-gray-500">جاري تحميل الخدمات...</p>
            </div>
          </div>
        </div>
        {showFilters && (
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        )}
        <ServiceSkeleton count={limit} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-bold text-red-800">خطأ في تحميل الخدمات الشائعة</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            المحاولة مرة أخرى
          </Button>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <TrendingUp className="h-12 w-12 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-blue-800">لا توجد خدمات شائعة حالياً</h3>
          <p className="text-blue-600 mt-2">لم يتم العثور على خدمات شائعة في هذا القسم.</p>
        </div>
      </div>
    );
  }

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-orange-500" />
          <div>
            <h2 className="text-xl font-bold">الخدمات الشائعة</h2>
            <p className="text-sm text-gray-500">
              {services.length} خدمة • {stats.featured} مميزة • {stats.verified} معتمدة
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          {showFilters && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>تصفية:</span>
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <FilterChips 
          activeFilter={activeFilter} 
          onFilterChange={handleFilterChange} 
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {services.map((service) => (
          <div 
            key={service.id}
            className="transform transition-transform hover:scale-[1.02] duration-300"
          >
            <MiniServiceCard service={service} />
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mt-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            <span>خدمات مميزة معتمدة</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>تقييمات حقيقية من العملاء</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span>تسليم في الوقت المحدد</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PopularServices);
