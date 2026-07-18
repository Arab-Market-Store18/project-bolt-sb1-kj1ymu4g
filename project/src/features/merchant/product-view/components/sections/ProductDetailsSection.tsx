// features/merchant/product-view/components/sections/ProductDetailsSection.tsx
// features/merchant/product-view/components/sections/ProductDetailsSection.tsx
/**
 * الوظيفة: هذا المكون مسؤول عن عرض جميع التفاصيل النصية للمنتج.
 * يشمل ذلك الاسم، الفئات، التقييم العام، الوصف، المواصفات الإضافية، والأسعار.
 * فصل هذه التفاصيل في مكون خاص يجعل قراءة الكود أسهل وينظم المحتوى.
 */

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Heart, Info, Tag } from "lucide-react";
import { ProductDetails } from "@/features/merchant/product-view/types/product.types";

interface ProductDetailsSectionProps {
  product: ProductDetails;
}

export function ProductDetailsSection({ product }: ProductDetailsSectionProps) {
  return (
    <div className="space-y-8">
      <section>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {product.main_category_name && <Badge variant="outline">{product.main_category_name}</Badge>}
            {product.sub_category_name && (
              <>
                <span className="text-muted-foreground">/</span>
                <Badge variant="secondary">{product.sub_category_name}</Badge>
              </>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center gap-1 hover:underline cursor-pointer"
              aria-label="الانتقال إلى تقييمات المنتج"
            >
              <Star className={`h-5 w-5 ${(product.average_rating || 0) >= 1 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              <span className="font-semibold text-gray-700">{(product.average_rating || 0).toFixed(1)}</span>
              <span>({product.review_count || 0} تقييم)</span>
            </button>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-gray-700">{product.likes_count || 0}</span>
              <span>إعجاب</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section for Description */}
      {product.description && (
        <>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-3">مواصفات المنتج</h2>
            <p className="text-gray-700 leading-relaxed prose max-w-none">{product.description}</p>
          </section>
        </>
      )}

      {/* Section for Additional Details */}
      {product.additional_details && product.additional_details.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> مواصفات إضافية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-muted/30 p-4 rounded-lg">
              {product.additional_details.map((detail, index) => (
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

      {/* Section for Pricing */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" /> الأسعار
        </h2>
        <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
          <div className="flex items-baseline gap-2">
            {product.discount_price ? (
              <>
                <span className="text-3xl font-bold text-primary">
                  {product.discount_price.toLocaleString()} {product.currency || "ر.س"}
                </span>
                <span className="text-xl line-through text-muted-foreground">
                  {product.price.toLocaleString()} {product.currency || "ر.س"}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-primary">
                {product.price.toLocaleString()} {product.currency || "ر.س"}
              </span>
            )}
          </div>
          {product.additional_prices && product.additional_prices.length > 0 && (
            <div className="pt-4 space-y-2">
              {product.additional_prices.map((ap, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-sky-50 border-l-4 border-sky-500 rounded-lg">
                  <span className="font-semibold text-sky-800">{ap.label}</span>
                  <span className="font-bold text-lg text-sky-900">
                    {ap.price.toLocaleString()} {ap.currency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}