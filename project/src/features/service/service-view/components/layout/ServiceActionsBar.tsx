// المسار: features/service/service-view/components/layout/ServiceActionsBar.tsx
// -- ملف جديد حسب الهيكل المنظم --


"use client";
import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PhoneNumber {
  type: 'whatsapp' | 'mobile' | 'landline';
  number: string;
}

interface ServiceActionsBarProps {
  whatsappNumber?: string;
  mobilePhone?: PhoneNumber;
  onWhatsAppClick: () => void;
}

export const ServiceActionsBar = ({
  whatsappNumber,
  mobilePhone,
  onWhatsAppClick
}: ServiceActionsBarProps) => {
  return (
    <div className="sticky bottom-0 bg-white border-t p-3 sm:p-4 shadow-lg z-10 w-full">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Button
          size="lg"
          onClick={onWhatsAppClick}
          className="bg-green-600 hover:bg-green-700 h-12 sm:h-14 text-sm sm:text-base"
        >
          <MessageCircle className="ml-2 h-5 w-5" /> واتساب
        </Button>
        {mobilePhone ? (
          <Button asChild size="lg" variant="outline" className="h-14">
            <a href={`tel:${mobilePhone.number}`}>
              <Phone className="ml-2 h-5 w-5" /> اتصال
            </a>
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="h-14"
            onClick={() => toast.info("رقم الهاتف غير متوفر")}
          >
            <Phone className="ml-2 h-5 w-5" /> اتصال
          </Button>
        )}
      </div>
    </div>
  );
};
