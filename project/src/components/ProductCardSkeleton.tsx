// المسار: components/ProductCardSkeleton.tsx
// -- الإصدار 1: هيكل تحميل لبطاقة المنتج --

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // استيراد مكون الهيكل الأساسي

export const ProductCardSkeleton = () => {
  return (
    <div 
      className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900" 
      dir="rtl"
      // استخدام نفس الأبعاد الثابتة لضمان تطابق الحجم
      style={{ '--card-width': '220px', '--card-height': '420px', width: 'var(--card-width)', height: 'var(--card-height)' } as React.CSSProperties}
    >
      {/* 1. هيكل الصورة */}
      <Skeleton className="h-52 w-full" />

      {/* 2. هيكل المحتوى */}
      <div className="flex flex-1 flex-col justify-between p-4 pt-2">
        
        {/* هيكل معلومات البائع */}
        <div className="mb-2 flex flex-col items-stretch gap-2">
          <div className="flex w-full min-w-0 items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex self-end flex-shrink-0 items-center gap-1">
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
        
        {/* هيكل اسم المنتج */}
        <Skeleton className="h-8 w-full mb-2" />

        {/* هيكل السعر وعدد الإعجابات */}
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>

        {/* هيكل الفئة */}
        <Skeleton className="h-4 w-20 mb-2" />

        {/* 3. هيكل الأزرار */}
        <div className="mt-auto flex gap-2 pt-2">
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-9 w-1/2" />
        </div>
      </div>
    </div>
  );
};
