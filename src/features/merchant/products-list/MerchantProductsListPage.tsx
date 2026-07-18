// المسار: src/features/merchant/products-list/MerchantProductsListPage.tsx

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ProductCard } from '@/components/product-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';

export const revalidate = 0;

interface SellerInfo { 
  id: string; 
  business_name: string; 
  logo_url?: string | null; 
  description?: string; 
}

export default async function SellerProductsPage({ 
  params 
}: { 
  params: Promise<{ sellerId: string }> 
}) {
  // 1. الحصول على params
  const { sellerId } = await params;
  
  // 2. التحقق من صحة sellerId (يجب أن يكون UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sellerId)) {
    console.error('❌ Invalid UUID format:', sellerId);
    return notFound();
  }

  // 3. إنشاء Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 4. جلب بيانات البائع
    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (sellerError || !sellerData) {
      console.error('❌ Seller error:', sellerError);
      return notFound();
    }

    // 5. جلب المنتجات
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        currency,
        images,
        thumbnail_image_url,
        image_url,
        category,
        subcategory,
        video_url,
        created_at,
        likes_count,
        is_active,
        is_best_seller
      `)
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('❌ Products error:', productsError);
    }

    // 6. معالجة وتحويل البيانات
    const allProducts = (productsData || []).map(product => {
      // معالجة الصور
      let imagesArray: string[] = [];
      
      if (product.thumbnail_image_url) {
        imagesArray.push(product.thumbnail_image_url);
      }
      if (product.image_url) {
        imagesArray.push(product.image_url);
      }
      if (product.images) {
        try {
          if (typeof product.images === 'string') {
            const parsed = JSON.parse(product.images);
            if (Array.isArray(parsed)) {
              imagesArray = [...imagesArray, ...parsed.filter(Boolean)];
            }
          } else if (Array.isArray(product.images)) {
            imagesArray = [...imagesArray, ...product.images.filter(Boolean)];
          }
        } catch (e) {
          console.warn('Could not parse images:', e);
        }
      }

      // إذا لم توجد صور، استخدم placeholder
      if (imagesArray.length === 0) {
        imagesArray = ['/placeholder.svg'];
      }

      return {
        id: product.id,
        name: product.name || 'منتج بدون اسم',
        price: product.price || 0,
        currency: product.currency || 'SAR',
        images: imagesArray,
        category: product.category || 'عام',
        subcategory: product.subcategory || '',
        video_url: product.video_url,
        created_at: product.created_at,
        likes_count: product.likes_count || 0,
        is_best_seller: product.is_best_seller || false,
        seller: {
          id: sellerData.id,
          businessName: sellerData.business_name,
          logoUrl: sellerData.logo_url,
          followersCount: 0 // يمكنك إضافة هذا لاحقاً
        }
      };
    });

return (
  <div className="container mx-auto p-4" dir="rtl">
    {/* رأس صفحة البائع */}
    <div className="flex flex-col items-center text-center my-8">
      
      {/* --- ⬇️ جعل الصورة والاسم رابطًا ⬇️ --- */}
      <Link href={`/seller/${sellerId}`} className="group cursor-pointer">
        <Avatar className="h-24 w-24 mb-4 border-4 border-primary group-hover:border-secondary transition-colors">
          <AvatarImage 
            src={sellerData.logo_url || undefined} 
            alt={sellerData.business_name}
          />
          <AvatarFallback className="text-3xl bg-primary/10">
            {sellerData.business_name?.charAt(0) || 'ت'}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-bold group-hover:text-primary transition-colors">
          {sellerData.business_name}
        </h1>
      </Link>

      {sellerData.description && (
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          {sellerData.description}
        </p>
      )}
    </div>

        <hr className="my-8" />

        {/* إحصاءات */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              جميع منتجات {sellerData.business_name}
            </h2>
            <span className="text-sm text-muted-foreground">
              {allProducts.length} منتج
            </span>
          </div>
          
          {/* فلترة وترتيب (اختياري) */}
          <div className="mt-4 flex gap-4">
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option value="newest">الأحدث</option>
              <option value="price_low">الأقل سعراً</option>
              <option value="price_high">الأعلى سعراً</option>
              <option value="popular">الأكثر إعجاباً</option>
            </select>
          </div>
        </div>

        {/* عرض المنتجات */}
        {productsError ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">⚠️ ملاحظة:</p>
            <p className="text-yellow-700">
              تم العثور على التاجر لكن هناك مشكلة في تحميل المنتجات.
            </p>
          </div>
        ) : null}

        {allProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">
              {sellerData.business_name} لم يضف أي منتجات بعد.
            </div>
            <p className="text-sm text-gray-500">
              يمكنك التواصل مع البائع للاستفسار عن المنتجات القادمة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allProducts.map((product) => (
              <ProductCard 
                key={product.id}
                item={{
                  id: product.id,
                  name: product.name,
                  title: product.name,
                  price: product.price,
                  currency: product.currency,
                  images: product.images,
                  category: product.category,
                  subcategory: product.subcategory,
                  video_url: product.video_url,
                  created_at: product.created_at,
                  likes_count: product.likes_count,
                  is_best_seller: product.is_best_seller,
                  seller: product.seller,
                  sellers: [product.seller],
                  product_type: 'PRODUCT'
                }}
              />
            ))}
          </div>
        )}
      </div>
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">خطأ غير متوقع</h2>
          <p className="text-red-600">حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }
}
