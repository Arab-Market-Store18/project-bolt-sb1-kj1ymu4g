// المسار: components/product-section.tsx
// -- الإصدار النهائي: مع إصلاح تمرير allCategories إلى ProductCard --

"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ProductCard } from '@/components/product-card'; 
import { ProductCardSkeleton } from './ProductCardSkeleton';
import type { Product, Category } from '@/lib/types';
import { Loader2, ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/Icon';
import { useDragToScroll } from '@/hooks/useDragToScroll';

const getAllDescendantIds = (categoryId: number, categories: Category[]): number[] => {
  const descendantIds: number[] = [categoryId];
  const queue: number[] = [categoryId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = categories.filter(cat => cat.parent_id === currentId);
    for (const child of children) {
      descendantIds.push(child.id);
      queue.push(child.id);
    }
  }
  return descendantIds;
};

interface ProductSectionProps {
  title: string;
  emoji: string;
  products: Product[];
  allCategories: Category[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  productRefs?: React.MutableRefObject<Map<string, HTMLDivElement>>;
  highlightedProductId?: string | null;
}

export function ProductSection({
  title,
  emoji,
  products,
  allCategories,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  productRefs,
  highlightedProductId 
}: ProductSectionProps) {

    // ▼▼▼ أضف هذا الكود للفحص ▼▼▼

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const productsScrollContainerRef = useRef<HTMLDivElement>(null);
  const prevIsFetchingRef = useRef(isFetchingNextPage);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');

  const mainCategories = useMemo(() => {
    if (!allCategories) return [];
    const uniqueCategories = new Map<number, Category>();
    allCategories.forEach(cat => {
      if (cat.parent_id === null) {
        uniqueCategories.set(cat.id, cat);
      }
    });
    return Array.from(uniqueCategories.values());
  }, [allCategories]);

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') return products;
    if (!allCategories) return [];
    const targetCategoryIds = getAllDescendantIds(activeCategoryId, allCategories);
    return products.filter(p => {
      const productCategoryId = (p as any).category_id;
      return productCategoryId != null && targetCategoryIds.includes(productCategoryId);
    });
  }, [activeCategoryId, products, allCategories]);

  const categoriesScrollRef = useDragToScroll();

  useEffect(() => {
    if (prevIsFetchingRef.current && !isFetchingNextPage) {
      const container = productsScrollContainerRef.current;
      if (container) { container.scrollBy({ left: -340, behavior: 'smooth' }); }
    }
    prevIsFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (!fetchNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) { observer.observe(currentRef); }
    return () => { if (currentRef) { observer.unobserve(currentRef); } };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!products || products.length === 0) return null;

  const canShowButton = hasNextPage && filteredProducts.length > 4;

  return (
    <section dir="rtl" className="container mx-auto px-4 py-8 bg-sky-50 dark:bg-sky-900/20 rounded-xl my-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>{emoji}</span>
        {title}
      </h2>
      {mainCategories && mainCategories.length > 0 && (
        <div ref={categoriesScrollRef} className="flex items-center space-x-2 space-x-reverse overflow-x-scroll pb-4 mb-4 border-b dark:border-gray-700">
          <button onClick={() => setActiveCategoryId('all')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${activeCategoryId === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}>
            <Icon name="LayoutGrid" className="h-4 w-4" />
            <span>عرض الكل</span>
          </button>
          {mainCategories.map((category) => (
            <button key={category.id} onClick={() => setActiveCategoryId(category.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${activeCategoryId === category.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}>
              <Icon name={category.icon_name || 'Package'} className="h-4 w-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        {canShowButton && (
          <div className="sm:hidden absolute top-[150px] left-4 -translate-y-1/2 z-10">
            <Button variant="secondary" size="icon" className="rounded-full h-7 w-7 shadow-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-transform duration-200 ease-in-out hover:scale-110 active:scale-95" onClick={fetchNextPage} disabled={isFetchingNextPage} aria-label="تحميل المزيد">
              {isFetchingNextPage ? (<Loader2 className="h-3 w-3 animate-spin" />) : (<ArrowLeft className="h-3 w-4 text-red-500" />)}
            </Button>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div ref={productsScrollContainerRef} className="flex overflow-x-auto overflow-y-hidden p-2 -mx-2 space-x-4 space-x-reverse">
            <div className="grid grid-flow-col grid-rows-2 gap-x-4 gap-y-6">
              {filteredProducts
                .filter(product => product)
                .map((product) => (
                  <div key={`${title}-${product.id}`} data-product-id={product.id} ref={(el) => { if (el && productRefs) { productRefs.current.set(product.id, el); } }}>
                    
                    {/* ▼▼▼ هذا هو السطر الذي تم إصلاحه بالكامل ▼▼▼ */}
                    <ProductCard 
                      item={product} 
                      allCategories={allCategories} 
                      highlightedItemId={highlightedProductId} 
                    />
                    {/* ▲▲▲ نهاية منطقة الإصلاح ▲▲▲ */}

                  </div>
                ))
              }
            </div>
            
            {isFetchingNextPage && (
              <div className="grid grid-flow-col grid-rows-2 gap-x-4 gap-y-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            )}

            {fetchNextPage && <div ref={loadMoreRef} className="flex-shrink-0 w-1 h-1" />}
            {!hasNextPage && filteredProducts.length > 0 && (<div className="text-sm text-gray-500 w-24 text-center">لا يوجد المزيد</div>)}
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <SearchX className="h-12 w-12 mb-4 text-gray-400" />
            <p className="font-semibold">لا توجد منتجات في هذه الفئة حاليًا.</p>
            <p className="text-sm mt-1">جرب تحديد فئة أخرى من القائمة.</p>
          </div>
        )}
      </div>
    </section>
  );
}
