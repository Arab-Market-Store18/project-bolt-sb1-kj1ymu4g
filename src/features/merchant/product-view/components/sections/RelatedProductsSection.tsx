// features/merchant/product-view/components/sections/RelatedProductsSection.tsx
// features/merchant/product-view/components/sections/RelatedProductsSection.tsx
/**
 * الوظيفة: هذا المكون يعرض قائمة بالمنتجات المشابهة في تصميم أفقي (Swiper).
 * يتم استخدامه لعرض المنتجات من نفس الفئة لزيادة تفاعل المستخدم.
 * يتلقى قائمة المنتجات ويعرضها باستخدام مكون `ProductCard`.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { Category } from '../../types/product.types';

interface RelatedProductsSectionProps {
  similarProducts: any[];
  allCategories: Category[];
}

export function RelatedProductsSection({ similarProducts, allCategories }: RelatedProductsSectionProps) {
  const router = useRouter();

  const handleSimilarProductClick = (clickedProductId: string) => {
    router.push(`/products/${clickedProductId}`);
  };

  if (!similarProducts || similarProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">منتجات مشابهة</h2>
        <Button variant="ghost" className="text-primary">عرض الكل</Button>
      </div>
      <Swiper
        spaceBetween={16}
        slidesPerView={2.2}
        breakpoints={{
          640: { slidesPerView: 2.5 },
          768: { slidesPerView: 3.2 },
          1024: { slidesPerView: 4.2 }
        }}
        className="similar-products-swiper"
      >
        {similarProducts.filter(p => p).map((p) => (
          <SwiperSlide key={p.id}>
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleSimilarProductClick(p.id)}
            >
              <ProductCard item={p as any} allCategories={allCategories} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}