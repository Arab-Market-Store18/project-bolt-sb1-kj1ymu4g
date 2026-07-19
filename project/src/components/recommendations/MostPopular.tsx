// components/recommendations/MostPopular.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
  discount_price?: number;
  images: string[] | null;
  thumbnail_image_url: string | null;
  likes_count: number;
  sales_count?: number;           // 🎯 [جديد] عدد المبيعات
  conversion_rate?: number;       // 🎯 [جديد] معدل التحويل
  sellers: {
    business_name: string;
    logo_url: string | null;
    rating?: number;              // 🎯 [جديد] تقييم البائع
  };
}

export function MostPopular() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMostPopular = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/recommendations/most-popular');
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات من الخادم');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error || 'فشل في تحميل المنتجات الشائعة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
      console.error('Error fetching most popular:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMostPopular();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          المنتجات الأكثر انتشاراً
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          المنتجات الأكثر انتشاراً
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-red-500 mb-2">{error}</p>
          <Button 
            onClick={fetchMostPopular} 
            variant="outline" 
            className="mt-2"
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          المنتجات الأكثر انتشاراً
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>لا توجد منتجات شائعة حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          المنتجات الأكثر انتشاراً
        </h3>
        <span className="text-sm text-muted-foreground">
          {products.length} منتج
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <div key={product.id} className="transform transition-transform hover:scale-105">
            <ProductCard 
              item={{
                id: product.id,
                name: product.name,
                price: product.price,
                currency: product.currency,
                discount_price: product.discount_price,
                images: product.images,
                thumbnail_image_url: product.thumbnail_image_url,
                likes_count: product.likes_count,
                sales_count: product.sales_count,     // 🎯 [جديد] تمرير عدد المبيعات
                conversion_rate: product.conversion_rate, // 🎯 [جديد] تمرير معدل التحويل
                sellers: product.sellers
              }}
              allCategories={[]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
