// المسار: app/products/products-client.tsx
// -- هذا الكود صحيح ولا يحتاج إلى تعديل --
"use client";
import { ProductCard } from '@/components/product-card';
import type { Product as ProductType, Category } from '@/lib/types'; // <-- إضافة Category هنا
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'; // <-- إضافة useQuery
import { Package, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSearchParams, useRouter } from 'next/navigation';
import { useModal } from '@/hooks/use-modal';
// --- دالة جلب كل الفئات (مطلوبة لـ ProductCard) ---
const fetchAllCategories = async (): Promise<Category[]> => {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon_name, parent_id');
  if (error) {
    throw new Error('فشل جلب الفئات.');
  }
  return data as Category[];
};
export function ProductsClient() {
  const supabase = createSupabaseBrowserClient();
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onOpen } = useModal();
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const productRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // --- استعلام جلب كل الفئات ---
  const { data: allCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['allCategories'],
    queryFn: fetchAllCategories,
    staleTime: 1000 * 60 * 60, // ساعة واحدة
  });
  const fetchProducts = async ({ pageParam = 0 }) => {
    const limit = 20;
    const offset = pageParam * limit;
    // نفترض أن لديك دالة RPC اسمها 'get_products_with_like_status'
    // إذا لم تكن موجودة، يجب استخدام استعلام select عادي
    const { data, error } = await supabase.rpc('get_products_with_like_status', {
      p_sort_option: 'created_at_desc',
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw new Error(error.message);
    return data as ProductType[];
  };
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage, allPages) => lastPage.length > 0 ? allPages.length : undefined,
    initialPageParam: 0,
  });
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);
  const flatProducts = data?.pages.flatMap(page => page) ?? [];
  const uniqueProducts = flatProducts.filter((product, index, self) =>
    index === self.findIndex((p) => p.id === product.id)
  );
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (!highlightId || uniqueProducts.length === 0) return;
    const targetElement = productRefs.current.get(highlightId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedProductId(highlightId);
      const openModalTimeout = setTimeout(() => {
        onOpen('productView', { productId: highlightId });
      }, 800);
      const cleanupTimeout = setTimeout(() => {
        setHighlightedProductId(null);
        const newUrl = window.location.pathname;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
      }, 3000);
      return () => {
        clearTimeout(openModalTimeout);
        clearTimeout(cleanupTimeout);
      };
    }
  }, [searchParams, uniqueProducts, onOpen, router]);
  if (status === 'pending' || isLoadingCategories) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-16 w-16 animate-spin text-gray-500" /></div>;
  }
  if (status === 'error') {
    return <div className="text-center text-red-500">حدث خطأ: {error.message}</div>;
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">جميع المنتجات</h1>
      {uniqueProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center">
            {uniqueProducts.map((product) => (
              <div
                key={product.id}
                ref={(el) => {
                  if (el) {
                    productRefs.current.set(product.id, el);
                  } else {
                    productRefs.current.delete(product.id);
                  }
                }}
                className={`transition-all duration-500 rounded-lg ${
                  highlightedProductId === product.id 
                    ? 'ring-4 ring-offset-2 ring-blue-500 shadow-2xl' 
                    : ''
                }`}
              >
                {/* تمرير allCategories إلى ProductCard */}
                <ProductCard product={product} allCategories={allCategories || []} />
              </div>
            ))}
          </div>
          <div ref={ref} className="h-10">
            {isFetchingNextPage && <div className="flex justify-center items-center mt-4"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>}
          </div>
        </>
      ) : (
        <div className="text-center py-16"><Package className="mx-auto h-16 w-16 text-gray-400" /><h3 className="mt-4 text-xl font-medium text-gray-700">لا توجد منتجات لعرضها حالياً</h3></div>
      )}
    </div>
  );
}
