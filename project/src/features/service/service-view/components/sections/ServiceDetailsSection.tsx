// المسار: features/service/service-view/components/sections/ServiceDetailsSection.tsx
"use client";

import { Star, Heart, Tag, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import { Service, ServiceDetailsSectionProps } from '../../types/service.types';

// دالة مساعدة لتنسيق الأرقام
const formatNumber = (num: number): string => {
  return num.toLocaleString('ar-SA');
};

export const ServiceDetailsSection = ({ 
  service, 
  currentUser, 
  onOpen 
}: ServiceDetailsSectionProps) => {
  if (!service) return null;

  return (
    <div className="space-y-8">
      <section>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {service.main_category_name && (
              <Badge variant="outline">{service.main_category_name}</Badge>
            )}
            {service.sub_category_name && (
              <>
                <span className="text-muted-foreground">/</span>
                <Badge variant="secondary">{service.sub_category_name}</Badge>
              </>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{service.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => document.getElementById('service-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center gap-1 hover:underline cursor-pointer"
              aria-label="الانتقال إلى تقييمات الخدمة"
            >
              <Star className={`h-5 w-5 ${(service.average_rating || 0) >= 1 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              <span className="font-semibold text-gray-700">{(service.average_rating || 0).toFixed(1)}</span>
              <span>({service.review_count || 0} تقييم)</span>
            </button>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-gray-700">{formatNumber(service.likes_count || 0)}</span>
              <span>إعجاب</span>
            </div>
          </div>
        </div>
      </section>
      
      {service.description && (
        <>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-3">تفاصيل الخدمة</h2>
            <p className="text-gray-700 leading-relaxed prose max-w-none">{service.description}</p>
          </section>
        </>
      )}

      {service.additional_details && service.additional_details.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> تفاصيل إضافية للخدمة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-muted/30 p-4 rounded-lg">
              {service.additional_details.map((detail, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">{detail.feature}:</span>
                  <span className="text-gray-600">{detail.value}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      
      <Separator />
      
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" /> الأسعار
        </h2>
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
          <div className="flex items-baseline gap-2">
            {service.discount_price ? (
              <>
                <span className="text-3xl font-bold text-primary">
                  {formatNumber(service.discount_price)} {service.currency || "ر.س"}
                </span>
                <span className="text-xl line-through text-muted-foreground">
                  {formatNumber(service.price)} {service.currency || "ر.س"}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-primary">
                {formatNumber(service.price)} {service.currency || "ر.س"}
              </span>
            )}
          </div>
          
          {service.additional_prices && service.additional_prices.length > 0 && (
            <div className="pt-4 space-y-2">
              {service.additional_prices.map((ap, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-sky-50 border-l-4 border-sky-500 rounded-lg">
                  <span className="font-semibold text-sky-800">{ap.label}</span>
                  <span className="font-bold text-lg text-sky-900">
                    {formatNumber(ap.price)} {ap.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
};