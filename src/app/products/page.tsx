// المسار: app/products/page.tsx
// -- النسخة المحسنة مع الحفاظ الكامل على البنية --
// ▼▼▼ بداية التعديل: تغيير الاستيراد إلى @supabase/ssr ▼▼▼
import { createServerClient } from '@supabase/ssr';
// ▲▲▲ نهاية التعديل ▲▲▲
import { cookies } from 'next/headers';
import { ProductCard } from '@/components/product-card';
import { Package } from 'lucide-react';
import type { Product as ProductType, Seller as SellerType } from '@/lib/types';
export const revalidate = 0;
export default async function ProductsPage() {
  const cookieStore = cookies();
  // ▼▼▼ بداية التعديل: تحديث دالة إنشاء العميل ▼▼▼
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  );
  // ▲▲▲ نهاية التعديل ▲▲▲
  // ⭐ تحسين: إضافة تصفية للمنتجات فقط
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`
      *,
      sellers (id, business_name, logo_url, phone_numbers)
    `)
    .eq('product_type', 'PRODUCT') // ⭐ إضافة هذا السطر فقط
    .order('created_at', { ascending: false });
  if (error) {
    return <div className="text-center py-8 text-red-500">حدث خطأ أثناء جلب المنتجات: {error.message}</div>;
  }
  const allProducts: ProductType[] = productsData?.map(p => {
    let whatsappNumber = null;
    if (p.sellers && Array.isArray(p.sellers.phone_numbers)) {
      const whatsappEntry = p.sellers.phone_numbers.find((phone: any) => phone.type === 'whatsapp');
      if (whatsappEntry) {
        whatsappNumber = whatsappEntry.number;
      }
    }
    const sellerData = p.sellers ? {
      id: p.sellers.id,
      businessName: p.sellers.business_name,
      logoUrl: p.sellers.logo_url,
      whatsapp: whatsappNumber,
    } : {
      id: 'unknown',
      businessName: 'متجر غير معروف',
      whatsapp: null,
    };
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      images: p.images,
      category: p.category,
      video_url: p.video_url,
      created_at: p.created_at,
      description: p.description,
      seller: sellerData,
      // ⭐ تحسين: إضافة الحقول الأساسية للتوافق
      product_type: p.product_type, // ✅ إضافة
      category_id: p.category_id,   // ✅ إضافة
      likes_count: p.likes_count,   // ✅ إضافة
    };
  }) || [];
  if (allProducts.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg container mx-auto mt-8">
        <Package className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-xl font-medium text-gray-700">لا توجد منتجات لعرضها حالياً</h3>
        <p className="mt-2 text-gray-500">كن أول من يضيف منتجاً جديداً إلى سوق العرب!</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">جميع المنتجات</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center">
        {allProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
          />
        ))}
      </div>
    </div>
  );
}
