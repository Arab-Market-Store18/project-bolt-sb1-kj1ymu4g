// features/service/profile-service/components/ProfileServiceInfoCard.tsx
// -- بطاقة معلومات مقدم الخدمة - الإصدار النهائي 2026 --

"use client";

import { Info, Briefcase, Award, Clock, MapPin, Globe, Building, Star, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProfileServiceInfoCardProps } from '../types/profile-service.types';

export const ProfileServiceInfoCard = ({ provider }: ProfileServiceInfoCardProps) => {
  const basicDetails = [
    { label: 'التخصص الدقيق', value: provider.specialization, icon: Briefcase },
    { label: 'المؤهلات العلمية', value: provider.qualifications, icon: Award },
    { label: 'الشهادات المهنية', value: provider.certifications, icon: Award },
    { label: 'سنوات الخبرة', value: provider.years_of_experience, icon: Clock },
    { label: 'أوقات التوفر', value: provider.availability, icon: Clock },
  ].filter(d => d.value);

  const locationDetails = [
    { label: 'المدينة', value: provider.city, icon: MapPin },
    { label: 'البلد', value: provider.country, icon: Globe },
    { label: 'العنوان الفعلي', value: provider.physical_address, icon: MapPin },
  ].filter(d => d.value);

  const businessDetails = [
    { label: 'نوع المزود', value: provider.provider_type?.join('، '), icon: Tag },
    { label: 'نوع المتجر', value: provider.store_type, icon: Building },
  ].filter(d => d.value);

  const hasContent = 
    basicDetails.length > 0 || 
    locationDetails.length > 0 || 
    businessDetails.length > 0 || 
    provider.description || 
    provider.working_days?.length > 0;

  if (!hasContent) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        <span>عن مقدم الخدمة</span>
        {provider.rating && (
          <button
            type="button"
            onClick={() => document.getElementById('provider-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center gap-1 mr-2 text-yellow-600 hover:underline cursor-pointer"
            aria-label="الانتقال إلى تقييمات العملاء"
          >
            <Star className="h-5 w-5 fill-current" />
            <span className="font-bold">{provider.rating.toFixed(1)}</span>
          </button>
        )}
      </h2>
      <div className="bg-muted p-4 rounded-lg space-y-6">
        {provider.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {provider.description}
          </p>
        )}

        {locationDetails.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> 
              الموقع الجغرافي
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locationDetails.map(detail => (
                <div key={detail.label} className="flex items-start gap-3">
                  <detail.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{detail.label}</h4>
                    <p className="text-sm text-muted-foreground">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {basicDetails.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">المعلومات المهنية</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {basicDetails.map(detail => (
                <div key={detail.label} className="flex items-start gap-3">
                  <detail.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{detail.label}</h4>
                    <p className="text-sm text-muted-foreground">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {businessDetails.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">معلومات العمل</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessDetails.map(detail => (
                <div key={detail.label} className="flex items-start gap-3">
                  <detail.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{detail.label}</h4>
                    <p className="text-sm text-muted-foreground">{detail.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {provider.working_days && provider.working_days.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> 
              أيام العمل
            </h4>
            <div className="flex flex-wrap gap-2">
              {provider.working_days.map(day => (
                <Badge key={day} variant="outline">{day}</Badge>
              ))}
            </div>
          </div>
        )}

        {provider.emergency_service && (
          <div className="pt-4 border-t">
            <Badge variant="destructive" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              يوفر خدمة طوارئ على مدار الساعة
            </Badge>
          </div>
        )}
      </div>
    </section>
  );
};