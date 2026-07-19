// features/merchant/product-view/components/layout/ProductPageSkeleton.tsx
// features/merchant/product-view/components/layout/ProductPageSkeleton.tsx
/**
 * الوظيفة: هذا المكون يعرض هيكل الصفحة (Skeleton) أثناء تحميل البيانات.
 * يوفر تجربة مستخدم أفضل من خلال عرض شاشة تحميل مرئية بدلاً من شاشة فارغة.
 */

import React from 'react';
import { Loader2 } from "lucide-react";

export function ProductPageSkeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}