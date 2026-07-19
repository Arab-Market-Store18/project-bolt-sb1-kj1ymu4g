// المسار: hooks/use-realtime-products.ts
// -- النسخة المصححة مع استخدام useAuth --

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/utils/supabase/client';
import { type Product } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/context/AuthContext'; // <-- إضافة استيراد useAuth

export function useRealtimeProducts(sellerId: string | null) {
  const supabase = createSupabaseBrowserClient();
  const { user, isSeller } = useAuth(); // <-- الحصول على المستخدم والتحقق من كونه تاجر
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInitialProducts = useCallback(async () => {
    if (!sellerId) {
      setIsLoading(false);
      setProducts([]);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *, 
        category:category_id (id, name), 
        main_category:main_category_id (id, name),
        sellers (id, business_name, logo_url, country, phone_numbers)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      toast({
        title: "خطأ في جلب المنتجات",
        description: error.message,
        variant: "destructive",
      });
      setProducts([]);
    } else {
      setProducts(data as Product[]);
    }
    setIsLoading(false);
  }, [sellerId, supabase, toast]);

  useEffect(() => {
    fetchInitialProducts();
  }, [fetchInitialProducts]);

  useEffect(() => {
    if (!sellerId) return;

    const channel = supabase
      .channel(`realtime-products-seller:${sellerId}`)
      .on<Product>(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'products', 
          filter: `seller_id=eq.${sellerId}` 
        },
        async (payload) => {
          console.log('Realtime change received:', payload);

          // حدث إضافة منتج جديد
          if (payload.eventType === 'INSERT') {
            const newProduct = payload.new as Product;
            
            // جلب البيانات الكاملة مع العلاقات للإضافة
            const { data: fullNewProduct, error } = await supabase
              .from('products')
              .select(`
                *, 
                category:category_id (id, name), 
                main_category:main_category_id (id, name),
                sellers:seller_id (id, business_name, logo_url, country, phone_numbers)
              `)
              .eq('id', newProduct.id)
              .single();

            if (fullNewProduct && !error) {
              setProducts((prevProducts) => [fullNewProduct as Product, ...prevProducts]);
              
              // إظهار الإشعار فقط إذا كان المستخدم الحالي هو التاجر (وليس مستخدم آخر)
              if (user && isSeller && user.id === sellerId) {
                toast({ title: "تمت إضافة منتج جديد", description: newProduct.name });
              }
            } else {
              await fetchInitialProducts();
            }
          }

          // حدث تحديث منتج
          if (payload.eventType === 'UPDATE') {
            const updatedProduct = payload.new as Product;
            
            // جلب البيانات الكاملة مع العلاقات للتحديث
            const { data: fullUpdatedProduct, error } = await supabase
              .from('products')
              .select(`
                *, 
                category:category_id (id, name), 
                main_category:main_category_id (id, name),
                sellers:seller_id (id, business_name, logo_url, country, phone_numbers)
              `)
              .eq('id', updatedProduct.id)
              .single();

            if (fullUpdatedProduct && !error) {
              setProducts((prevProducts) =>
                prevProducts.map((product) =>
                  product.id === updatedProduct.id 
                    ? fullUpdatedProduct as Product
                    : product
                )
              );
              
              // إظهار الإشعار فقط إذا كان المستخدم الحالي هو التاجر
              if (user && isSeller && user.id === sellerId) {
                toast({ title: "تم تحديث المنتج", description: updatedProduct.name });
              }
            } else {
              await fetchInitialProducts();
            }
          }

          // حدث حذف منتج
          if (payload.eventType === 'DELETE') {
            const deletedProduct = payload.old as Partial<Product>;
            setProducts((prevProducts) =>
              prevProducts.filter((product) => product.id !== deletedProduct.id)
            );
            
            // إظهار الإشعار فقط إذا كان المستخدم الحالي هو التاجر
            if (user && isSeller && user.id === sellerId) {
              toast({ title: "تم حذف منتج", variant: "destructive" });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, supabase, toast, fetchInitialProducts, user, isSeller]); // <-- إضافة user و isSeller كمُتَبعِدات

  return { products, isLoadingProducts: isLoading, setProducts };
}