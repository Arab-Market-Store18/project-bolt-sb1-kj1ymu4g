// features/merchant/product-view/actions/fetchProduct.action.ts
// -- النسخة النهائية المصححة: تم فصل استعلام التقييمات --

import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";
import { ProductDetails, Category } from "../types/product.types";
import { Review } from "../types/review.types";
import { unstable_noStore as noStore } from 'next/cache'; 

export async function fetchProduct(productId: string): Promise<{ product: ProductDetails | null; similarProducts: any[]; allCategories: Category[] }> {
  noStore(); 

  const supabase = createSupabaseBrowserClient();

  if (!productId) {
    return { product: null, similarProducts: [], allCategories: [] };
  }

  // --- ⬇️⬇️⬇️ هذا هو الجزء الذي تم تعديله بالكامل ⬇️⬇️⬇️ ---

  // الخطوة 1: جلب بيانات المنتج والبائع فقط
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(`*, sellers(*)`) 
    .eq('id', productId)
    .maybeSingle(); // ✅ أكثر تسامحًا وأمانًا

  if (productError || !productData) {
    if (productError?.message?.includes('AbortError') || productError?.name === 'AbortError') {
      console.log('Request was cancelled by user navigation');
      return { product: null, similarProducts: [], allCategories: [] };
    }
    console.error("Error fetching product:", productError?.message);
    throw new Error(productError?.message || "المنتج غير موجود.");
  }

  // الخطوة 2: جلب تقييمات هذا المنتج في استعلام منفصل
  const { data: reviewsData, error: reviewsError } = await supabase
    .from('product_reviews') // ✅ استخدام الجدول الصحيح
    .select('*')
    .eq('product_id', productId); // ✅ الفلترة بالعمود الصحيح

  if (reviewsError) {
    console.error("Error fetching product reviews:", reviewsError.message);
    // لا نوقف التنفيذ، فقط نعرض المنتج بدون تقييمات
  }

  // --- ⬆️⬆️⬆️ نهاية الجزء المعدل ⬆️⬆️⬆️ ---

  const { data: categoriesData } = await supabase.from('categories').select('*');
  const allCategories = categoriesData || [];
  const categoriesMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

  const sellerData = Array.isArray(productData.sellers) ? productData.sellers[0] : productData.sellers;
  
  // ✅ استخدام بيانات التقييمات التي جلبناها
  const allReviews = reviewsData || [];
  const originalReviews = allReviews.filter((r: Review) => !r.parent_review_id);

  const product: ProductDetails = {
    ...productData,
    reviews: allReviews, // ✅ إضافة مصفوفة التقييمات الكاملة إلى الكائن
    sellers: sellerData ? {
      ...sellerData,
      whatsapp: sellerData.phone_numbers?.find((p: any) => p.type === 'whatsapp')?.number
    } : null,
    main_category_name: categoriesMap.get(productData.main_category_id),
    sub_category_name: categoriesMap.get(productData.category_id),
    average_rating: originalReviews.length > 0
      ? (originalReviews.reduce((acc: number, r: Review) => acc + (r.rating || 0), 0) / originalReviews.length)
      : 0,
    review_count: originalReviews.length,
  };

  let similarProducts: any[] = [];
  if (product.category_id) {
    const { data: similarData } = await supabase
      .from('products')
      .select(`*, sellers(*)`)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .limit(6);

    if (similarData) {
      similarProducts = similarData.map(p => ({
        ...p,
        sellers: Array.isArray(p.sellers) ? p.sellers[0] : p.sellers
      }));
    }
  }

  return { product, similarProducts, allCategories };
}
