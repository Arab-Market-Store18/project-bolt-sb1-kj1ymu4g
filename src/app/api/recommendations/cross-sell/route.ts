// المسار: app/api/recommendations/cross-sell/route.ts
// ? الإصدار المصحح - بدون conversion_rate، مع likes_count الحقيقي

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentProductId = searchParams.get('currentProductId');
    const categoryId = searchParams.get('categoryId');
    const mainCategoryId = searchParams.get('mainCategoryId');

    // ? التحقق من المتغيرات البيئية
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'جاري التهيئة'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    if (!currentProductId) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'معرف المنتج مطلوب'
      });
    }

    // ?? خطوة 1: جلب المنتج الحالي
    const { data: currentProduct, error: currentProductError } = await supabase
      .from('products')
      .select('category_id, main_category_id')
      .eq('id', currentProductId)
      .single();

    if (currentProductError || !currentProduct) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'المنتج غير موجود'
      });
    }

    // ?? خطوة 2: بناء الاستعلامات المتوازية
    const targetCategoryId = categoryId || currentProduct.category_id;
    const targetMainCategoryId = mainCategoryId || currentProduct.main_category_id;

    // ? استعلامات متوازية لجلب 50 منتج
    const [
      { data: sameCategoryProducts, error: sameCategoryError },
      { data: sameMainCategoryProducts, error: sameMainCategoryError },
      { data: randomProducts, error: randomProductsError }
    ] = await Promise.all([
      // 1. نفس الفئة الفرعية
      supabase
        .from('products')
        .select(`
          id, name, price, currency, discount_price, images,
          thumbnail_image_url, likes_count, tags,
          created_at, seller_id, category_id, main_category_id
        `)
        .neq('id', currentProductId)
        .eq('category_id', targetCategoryId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('likes_count', { ascending: false })
        .limit(25),

      // 2. نفس الفئة الرئيسية (ولكن ليس نفس الفرعية)
      supabase
        .from('products')
        .select(`
          id, name, price, currency, discount_price, images,
          thumbnail_image_url, likes_count, tags,
          created_at, seller_id, category_id, main_category_id
        `)
        .neq('id', currentProductId)
        .neq('category_id', targetCategoryId)
        .eq('main_category_id', targetMainCategoryId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(25),

      // 3. منتجات متنوعة
      supabase
        .from('products')
        .select(`
          id, name, price, currency, discount_price, images,
          thumbnail_image_url, likes_count, tags,
          created_at, seller_id, category_id, main_category_id
        `)
        .neq('id', currentProductId)
        .neq('main_category_id', targetMainCategoryId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('likes_count', { ascending: false })
        .limit(25)
    ]);

    // ? التحقق من الأخطاء (لا تطبع رسائل خطأ في الإنتاج)

    // ?? خطوة 3: دمج وتنظيم النتائج
    let allProducts: any[] = [];
    
    // الأولوية 1: نفس الفئة الفرعية
    if (sameCategoryProducts && sameCategoryProducts.length > 0) {
      allProducts = [...allProducts, ...sameCategoryProducts];
    }
    
    // الأولوية 2: نفس الفئة الرئيسية
    if (sameMainCategoryProducts && sameMainCategoryProducts.length > 0) {
      allProducts = [...allProducts, ...sameMainCategoryProducts];
    }
    
    // الأولوية 3: منتجات متنوعة (أضف حتى نصل إلى 50)
    if (randomProducts && randomProducts.length > 0) {
      const needed = 50 - allProducts.length;
      if (needed > 0) {
        const selectedRandom = randomProducts.slice(0, needed);
        allProducts = [...allProducts, ...selectedRandom];
      }
    }

    // ?? خطوة 4: تحسين البيانات
    const enhancedProducts = await Promise.all(
      allProducts.slice(0, 50).map(async (product) => {
        // ? جلب بيانات البائع
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('business_name, logo_url')
          .eq('id', product.seller_id)
          .single();

        // ? تحديد نوع التوصية
        let productType = 'متنوع';
        if (product.category_id == targetCategoryId) {
          productType = 'نفس الفئة';
        } else if (product.main_category_id == targetMainCategoryId) {
          productType = 'نفس القسم';
        }

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency || 'ر.س',
          discount_price: product.discount_price,
          images: product.images || [],
          thumbnail_image_url: product.thumbnail_image_url,
          likes_count: product.likes_count || 0, // ? المهم: إرسال likes_count الحقيقي
          tags: product.tags || [],
          product_type: productType,
          sellers: {
            business_name: sellerData?.business_name || 'متجر',
            logo_url: sellerData?.logo_url || null,
          }
        };
      })
    );

    // ?? خطوة 5: ترتيب النتائج
    const sortedProducts = enhancedProducts.sort((a, b) => {
      // أولاً: نفس الفئة الفرعية
      if (a.product_type === 'نفس الفئة' && b.product_type !== 'نفس الفئة') return -1;
      if (b.product_type === 'نفس الفئة' && a.product_type !== 'نفس الفئة') return 1;
      
      // ثانياً: نفس الفئة الرئيسية
      if (a.product_type === 'نفس القسم' && b.product_type !== 'نفس القسم') return -1;
      if (b.product_type === 'نفس القسم' && a.product_type !== 'نفس القسم') return 1;
      
      // ثالثاً: عدد الإعجابات (الأكثر إعجاباً أولاً)
      return (b.likes_count || 0) - (a.likes_count || 0);
    });

    return NextResponse.json({
      success: true,
      data: sortedProducts,
      message: `اخترنا لك ${sortedProducts.length} منتج`,
      stats: {
        total: sortedProducts.length,
        likes: {
          min: Math.min(...sortedProducts.map(p => p.likes_count || 0)),
          max: Math.max(...sortedProducts.map(p => p.likes_count || 0))
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      data: [],
      message: 'حدث خطأ في جلب التوصيات'
    });
  }
}
