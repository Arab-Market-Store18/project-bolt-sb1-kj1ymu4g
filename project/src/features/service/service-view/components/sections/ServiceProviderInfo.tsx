// المسار: features/service/service-view/components/sections/ServiceProviderInfo.tsx
// -- تم التعديل ليتوافق مع هيكل الأنواع الجديد --

"use client";

import { Briefcase, Award, Clock, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
// --- التغيير الأول: استيراد الأنواع من الملف المركزي ---
import { ServiceProviderInfoProps, ServiceProvider } from "../../../types/service.types";

/**
 * @description مكون لعرض معلومات مفصلة عن مقدم الخدمة.
 * @param provider - كائن يحتوي على بيانات مقدم الخدمة.
 */
export const ServiceProviderInfo = ({ provider }: ServiceProviderInfoProps) => {
  // --- التغيير الثاني: التحقق من وجود `provider` مباشرة ---
  if (!provider) return null;

  const detailItems = [
    { icon: Briefcase, label: "التخصص", value: provider.specialization },
    { icon: Award, label: "المؤهلات", value: provider.qualifications },
    { icon: Award, label: "الشهادات", value: provider.certifications },
    { icon: Clock, label: "سنوات الخبرة", value: provider.years_of_experience },
    { icon: Clock, label: "أوقات التوفر", value: provider.availability },
  ].filter(item => item.value);

  const hasWorkingDays = provider.working_days && provider.working_days.length > 0;

  // إذا لم تكن هناك أي تفاصيل لعرضها، لا تقم بتصيير المكون
  if (detailItems.length === 0 && !hasWorkingDays) {
    return null;
  }

  return (
    <>
      <Separator />
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" /> معلومات عن مقدم الخدمة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 bg-muted/30 p-4 rounded-lg">
          {detailItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3 py-2 border-b border-gray-200/60">
              <item.icon className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800">{item.label}:</span>
                <p className="text-gray-600 text-sm">{item.value}</p>
              </div>
            </div>
          ))}
        
          {hasWorkingDays && (
            <div className="flex items-start gap-3 py-2 border-b border-gray-200/60 md:col-span-2">
              <Clock className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-800">أيام العمل:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {provider.working_days!.map(day => (
                    <Badge key={day} variant="secondary">{day}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
