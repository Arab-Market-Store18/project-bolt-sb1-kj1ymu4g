// المسار: components/modals/LikedProductsDropdown.tsx
// -- نسخة محدثة مع إصلاح خطأ المفتاح المكرر --

"use client";

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { Loader2, Heart, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// ▼▼▼ تعديل 1: إضافة 'id' إلى الواجهة ▼▼▼
interface LikedProduct {
  id: string; // المفتاح الفريد من جدول product_likes
  product_id: string;
  products: { id: string; name: string; price: number; } | null;
}
interface LikedProductsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function LikedProductsDropdown({ isOpen, onClose, userId }: LikedProductsDropdownProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [likedProducts, setLikedProducts] = useState<LikedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLikedProducts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    
    // ▼▼▼ تعديل 2: إضافة 'id' إلى استعلام select ▼▼▼
    const { data, error: fetchError } = await supabase
      .from('product_likes')
      .select(`id, product_id, products (id, name, price)`) // <-- تم إضافة 'id' هنا
      .eq('user_id', userId)
      .limit(1000);

    if (fetchError) {
      console.error("Error fetching liked products:", fetchError);
      setError("حدث خطأ أثناء جلب المنتجات المفضلة.");
      setLikedProducts([]);
    } else {
      const validProducts = data.filter(item => item.products !== null) as LikedProduct[];
      setLikedProducts(validProducts);
    }
    setIsLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchLikedProducts();
    }
  }, [isOpen, userId, fetchLikedProducts]);

  const handleProductClick = (productId: string) => {
    onClose();
    router.push(`/?highlight=${productId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-20  w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"><Heart className="w-5 h-5 ml-2 text-red-500" />المنتجات المفضلة</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7"><X className="w-4 h-4" /></Button>
      </div>
      <div className="p-2 max-h-96 overflow-y-auto">
        {isLoading ? ( <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : error ? ( <div className="text-center p-8 text-red-500"><p>{error}</p></div>
        ) : likedProducts.length > 0 ? (
          <ul className="space-y-1">
            {likedProducts.map((item) => (
              item.products && (
                // ▼▼▼ تعديل 3: استخدام 'item.id' كمفتاح فريد ▼▼▼
                <li key={item.id}>
                  <button
                    onClick={() => handleProductClick(item.products!.id)}
                    className="w-full flex items-center justify-between text-right p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex-grow">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{item.products.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.products.price.toFixed(2)} ريال</p>
                    </div>
                    <ShoppingCart className="w-4 h-4 text-gray-400 group-hover:text-primary transition-opacity opacity-0 group-hover:opacity-100" />
                  </button>
                </li>
              )
            ))}
          </ul>
        ) : (
          <div className="text-center p-8 text-gray-500 dark:text-gray-400">
            <p className="font-semibold">قائمة المفضلة فارغة.</p>
            <p className="text-xs mt-1">أضف منتجات بالضغط على أيقونة القلب.</p>
          </div>
        )}
      </div>
    </div>
  );
}
