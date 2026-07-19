// المسار: components/recommendations/MiniProductCard.tsx

"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getOptimizedMediaUrl } from '@/lib/utils/cloudinary';

interface MiniProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    currency?: string;
    discount_price?: number;
    thumbnail_image_url?: string | null;
    images?: string[] | null;
  };
  seller?: {
    business_name?: string | null;
    logo_url?: string | null;
  } | null;
}

export function MiniProductCard({ product, seller }: MiniProductCardProps) {
  // يختار أفضل صورة متاحة
  const imageUrl = product.thumbnail_image_url 
    || (Array.isArray(product.images) && product.images[0]) 
    || '/placeholder.svg';

  // يحسن الصورة لسرعة التحميل
  const optimizedUrl = getOptimizedMediaUrl(imageUrl, 'thumbnail');

  // يعرض سعر الخصم إن وجد، وإلا فالسعر الأساسي
  const price = product.discount_price || product.price;

  return (
    // يجعل البطاقة بأكملها رابطاً لصفحة تفاصيل المنتج
    <Link href={`/products/${product.id}`} className="block w-32 flex-shrink-0 group">
      
      {/* حاوية الصورة المربعة */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden border bg-gray-100 group-hover:opacity-80 transition-opacity">
        <Image
          src={optimizedUrl}
          alt={product.name}
          fill
          sizes="128px"
          className="object-cover"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />

        {/* شعار التاجر - زاوية يسار أسفل الصورة */}
        {seller?.logo_url && (
          <div className="absolute bottom-1.5 left-1.5 z-10">
            <div className="h-7 w-7 rounded-full border-2 border-white shadow overflow-hidden bg-white">
              <img
                src={seller.logo_url}
                alt={seller.business_name || 'شعار التاجر'}
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        )}
      </div>

      {/* حاوية تفاصيل المنتج (الاسم والسعر) */}
      <div className="mt-2">
        <p className="text-xs font-semibold text-gray-800 truncate group-hover:underline" title={product.name}>
          {product.name}
        </p>
        <p className="text-sm font-bold text-primary">
          {price.toLocaleString()} {product.currency || 'ر.س'}
        </p>
      </div>
    </Link>
  );
}
