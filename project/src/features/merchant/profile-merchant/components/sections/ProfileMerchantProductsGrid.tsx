// المسار: features/merchant/profile-merchant/components/sections/ProfileMerchantProductsGrid.tsx

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { Package } from 'lucide-react';

// استقبل sellerId هنا
export const ProfileMerchantProductsGrid = ({ products, allCategories, sellerId }: { products: any[], allCategories: any[], sellerId: string }) => {
  const scrollRef = useDragToScroll<HTMLDivElement>();
  
  // --- حالة واحدة للفلترة داخل الشريط الأفقي ---
  const [activeFilter, setActiveFilter] = useState<'all' | 'bestseller' | 'offers'>('all');

  if (!products || products.length === 0) return null;

  // --- منطق الفلترة ---
  const filteredProducts = useMemo(() => {
    switch (activeFilter) {
      case 'bestseller':
        return products.filter(p => p.is_best_seller);
      case 'offers':
        return products.filter(p => p.discount_price);
      default: // 'all'
        return products;
    }
  }, [activeFilter, products]);

  // --- العينة التي ستعرض دائمًا في الشريط الأفقي ---
  const sampleProducts = filteredProducts.slice(0, 10);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">منتجات متجرنا</h2>
        
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          
          {/* --- الزر الرابع: "الكل" (للانتقال لصفحة جديدة) --- */}
          <Link href={`/seller/${sellerId}/products`} passHref>
            <Button as="a" size="sm" variant="primary">
              الكل
            </Button>
          </Link>

          {/* --- الثلاثة أزرار الأخرى (للفلترة في نفس الصفحة) --- */}
          <Button 
            size="sm" 
            variant={activeFilter === 'all' ? 'secondary' : 'ghost'} 
            onClick={() => setActiveFilter('all')}
          >
            جميع
          </Button>
          <Button 
            size="sm" 
            variant={activeFilter === 'bestseller' ? 'secondary' : 'ghost'} 
            onClick={() => setActiveFilter('bestseller')}
          >
            الأكثر انتشاراً
          </Button>
          <Button 
            size="sm" 
            variant={activeFilter === 'offers' ? 'secondary' : 'ghost'} 
            onClick={() => setActiveFilter('offers')}
          >
            عروض
          </Button>
        </div>
      </div>

      {/* --- الشريط الأفقي الذي يعرض العينة المفلترة --- */}
      {sampleProducts.length > 0 ? (
        <div 
          ref={scrollRef} 
          className="flex gap-1.5 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-muted-foreground/20"
        >
          {sampleProducts.map((product) => (
            <div key={product.id} className="flex-none w-52 mr-4 last:mr-0">
              <ProductCard 
                item={product} 
                allCategories={allCategories} 
                context="seller-profile"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-muted rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">لا توجد منتجات تطابق هذا التصنيف</h3>
        </div>
      )}
    </section>
  );
};