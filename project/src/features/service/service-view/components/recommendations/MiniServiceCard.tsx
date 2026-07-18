//: src/features/service/service-view/components/recommendations/MiniServiceCard.tsx
//: src/features/service/service-view/components/recommendations/MiniServiceCard.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Star, MapPin, CheckCircle } from 'lucide-react';
import { getOptimizedMediaUrl } from '@/lib/utils/cloudinary';
import { cn } from '@/lib/utils';

interface MiniServiceCardProps {
  service: {
    id: string;
    title: string;
    description?: string;
    base_price: number;
    currency?: string;
    discounted_price?: number;
    thumbnail_image_url?: string | null;
    images?: string[] | null;
    category?: {
      id: number;
      name: string;
    };
    provider?: {
      id: string;
      business_name: string;
      logo_url?: string | null;
      rating?: number;
      location?: string;
    };
    avg_rating?: number;
    review_count?: number;
    delivery_time_days?: number;
    is_featured?: boolean;
    is_verified?: boolean;
    tags?: string[];
  };
  className?: string;
}

export function MiniServiceCard({ service, className }: MiniServiceCardProps) {
  // اختيار أفضل صورة متاحة
  const imageUrl = service.thumbnail_image_url 
    || (Array.isArray(service.images) && service.images[0]) 
    || '/placeholder-service.svg';

  const optimizedUrl = getOptimizedMediaUrl(imageUrl, 'thumbnail');

  // تحديد السعر المعروض
  const price = service.discounted_price || service.base_price;
  const hasDiscount = service.discounted_price && service.discounted_price < service.base_price;

  // حساب الخصم كنسبة مئوية
  const discountPercentage = hasDiscount && service.base_price > 0
    ? Math.round(((service.base_price - service.discounted_price!) / service.base_price) * 100)
    : 0;

  return (
    <Link 
      href={`/services/${service.id}`} 
      className={cn(
        "block group bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden",
        "hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
    >
      {/* حاوية الصورة */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <Image
          src={optimizedUrl}
          alt={service.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.currentTarget.src = '/placeholder-service.svg'; }}
        />
        
        {/* الشارة المميزة */}
        {service.is_featured && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              مميز
            </span>
          </div>
        )}

        {/* شارة الخصم */}
        {hasDiscount && discountPercentage > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              {discountPercentage}% خصم
            </span>
          </div>
        )}

        {/* شارة موفر معتمد */}
        {service.is_verified && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>معتمد</span>
            </div>
          </div>
        )}
      </div>

      {/* محتوى البطاقة */}
      <div className="p-3 space-y-2">
        {/* العنوان */}
        <h3 
          className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors"
          title={service.title}
        >
          {service.title}
        </h3>

        {/* الوصف المختصر */}
        {service.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* التصنيف */}
        {service.category && (
          <div className="inline-block">
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              {service.category.name}
            </span>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="flex items-center justify-between pt-2 border-t">
          {/* السعر */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">
              {price.toLocaleString()} {service.currency || 'ر.س'}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                {service.base_price.toLocaleString()} {service.currency || 'ر.س'}
              </span>
            )}
          </div>

          {/* التقييم */}
          {service.avg_rating !== undefined && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-gray-700">
                {service.avg_rating.toFixed(1)}
              </span>
              {service.review_count && (
                <span className="text-xs text-gray-500">
                  ({service.review_count})
                </span>
              )}
            </div>
          )}
        </div>

        {/* معلومات الموفر */}
        {service.provider && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {/* شعار الموفر */}
            {service.provider.logo_url && (
              <div className="relative h-6 w-6 rounded-full overflow-hidden">
                <Image
                  src={getOptimizedMediaUrl(service.provider.logo_url, 'avatar')}
                  alt={service.provider.business_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            {/* اسم الموفر */}
            <span className="text-xs text-gray-600 truncate" title={service.provider.business_name}>
              {service.provider.business_name}
            </span>

            {/* الموقع */}
            {service.provider.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{service.provider.location}</span>
              </div>
            )}
          </div>
        )}

        {/* وقت التسليم */}
        {service.delivery_time_days && (
          <div className="flex items-center gap-1 text-xs text-gray-500 pt-2">
            <Clock className="h-3 w-3" />
            <span>يتم التسليم خلال {service.delivery_time_days} يوم</span>
          </div>
        )}

        {/* الوسوم */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {service.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {service.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{service.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}