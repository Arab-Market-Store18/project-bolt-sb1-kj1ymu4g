// features/merchant/product-view/components/layout/ProductActionsBar.tsx
// features/merchant/product-view/components/layout/ProductActionsBar.tsx
/**
 * الوظيفة: هذا المكون يعرض شريط الأزرار السفلي للتواصل (واتساب واتصال).
 * يظهر هذا الشريط فقط على الشاشات الصغيرة (الجوال) ويكون ثابتًا في الأسفل
 * لتسهيل وصول المستخدم إلى وسائل التواصل مع البائع.
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { ProductDetails } from '../../types/product.types';

interface ProductActionsBarProps {
  product: ProductDetails;
}

export function ProductActionsBar({ product }: ProductActionsBarProps) {
  const mobilePhone = product.sellers?.phone_numbers?.find(p => p.type === 'mobile');

  const handleWhatsAppClick = () => {
    if (product.sellers?.whatsapp) {
      const message = encodeURIComponent(`مرحباً، أنا مهتم بالمنتج: ${product.name}`);
      window.open(
        `https://wa.me/${product.sellers.whatsapp.replace(/[^0-9]/g, "" )}?text=${message}`,
        "_blank"
      );
    } else {
      toast.info("رقم الواتساب غير متوفر لهذا البائع.");
    }
  };

  return (
    <div className="lg:hidden sticky bottom-0 bg-white border-t p-4 shadow-lg z-20">
      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          onClick={handleWhatsAppClick}
          className="bg-green-600 hover:bg-green-700 h-14"
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
}