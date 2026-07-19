// المسار: components/ProductCarousel.tsx
// -- نسخة مُحصّنة ضد العناصر الفارغة (null/undefined) --

import { ProductCard } from "@/components/product-card";
import type { Product, Category, Service } from "@/lib/types"; // تم إضافة Service
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface ProductCarouselProps {
  title: string;
  // تم تحديث النوع ليقبل منتجات أو خدمات
  products: (Product | Service)[]; 
  allCategories: Category[];
}

export const ProductCarousel = ({ title, products, allCategories }: ProductCarouselProps) => (
  <div className="container mx-auto px-4 py-12">
    <h2 className="mb-6 text-2xl font-bold">{title}</h2>
    <Carousel opts={{ align: "start", direction: "rtl" }} className="w-full">
      <CarouselContent>
        {products
          // ▼▼▼ هذا هو الإصلاح: فلترة المصفوفة لإزالة أي عناصر فارغة ▼▼▼
          .filter(product => product) 
          .map((product) => (
            <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/5">
              <div className="p-1">
                {/* ▼▼▼ تحديث الـ props لتتوافق مع ProductCard المعدل ▼▼▼ */}
                <ProductCard item={product} allCategories={allCategories} />
              </div>
            </CarouselItem>
          ))
        }
      </CarouselContent>
      <CarouselPrevious className="right-12 left-auto" />
      <CarouselNext className="right-0 left-auto" />
    </Carousel>
  </div>
);
