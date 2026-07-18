/**
 * @file app/api/recommendations/related/route.ts
 * @description API لتوصيات "قد يعجبك" - يعرض منتجات من نفس البائع والفئة الرئيسية
 * @version 2.0.0 - محسن للأداء والأمان
 */

import { createRouteHandlerClient } from '@/lib/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// إعدادات الأداء
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // تحديث التخزين المؤقت كل ساعة
export const maxDuration = 10 // أقصى وقت تنفيذ 10 ثوان

// أنواع البيانات
interface RecommendationParams {
  sellerId: string
  currentProductId: string
  limit?: number
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  currency: string
  discount_price?: number
  thumbnail_image_url: string
  created_at: string
  likes_count: number
  category_id: string
  main_category_id: string
}

interface ApiResponse {
  success: boolean
  data: Product[]
  stats?: {
    total: number
    mainCategoryId: string | null
    withImages: number
    onDiscount: number
    avgLikes: number
  }
  error?: string
  cache?: {
    hit: boolean
    ttl: number
  }
}

/**
 * جلب الفئة الرئيسية للمنتج الحالي
 */
async function getCurrentProductMainCategory(
  supabase: any, 
  productId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('main_category_id')
      .eq('id', productId)
      .single()

    if (error || !data) {
      console.warn('Product not found or has no main category:', productId)
      return null
    }

    return data.main_category_id
  } catch (error) {
    console.error('Error fetching product category:', error)
    return null
  }
}

/**
 * جلب منتجات التوصيات مع التحسينات
 */
async function getRecommendations(
  supabase: any,
  params: RecommendationParams
): Promise<Product[]> {
  const { sellerId, currentProductId, limit = 12 } = params
  
  // 1. جلب الفئة الرئيسية للمنتج الحالي
  const mainCategoryId = await getCurrentProductMainCategory(supabase, currentProductId)
  
  // 2. بناء الاستعلام الأساسي
  let query = supabase
    .from('products')
    .select(`
      id, name, price, images, currency, discount_price,
      thumbnail_image_url, created_at, likes_count,
      category_id, main_category_id
    `)
    .eq('seller_id', sellerId)
    .neq('id', currentProductId)
    .eq('is_active', true)
    .eq('is_approved', true)

  // 3. تطبيق فلتر الفئة الرئيسية إذا وجدت
  if (mainCategoryId) {
    query = query.eq('main_category_id', mainCategoryId)
  }

  // 4. تطبيق الترتيب والحد
  query = query
    .order('likes_count', { ascending: false, nullsLast: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  return data || []
}

/**
 * حساب إحصائيات التوصيات
 */
function calculateStats(products: Product[], mainCategoryId: string | null) {
  const total = products.length
  const withImages = products.filter(p => p.images && p.images.length > 0).length
  const onDiscount = products.filter(p => p.discount_price && p.discount_price < p.price).length
  const avgLikes = total > 0 
    ? Math.round(products.reduce((sum, p) => sum + (p.likes_count || 0), 0) / total)
    : 0

  return {
    total,
    mainCategoryId,
    withImages,
    onDiscount,
    avgLikes
  }
}

/**
 * معالج طلبات GET
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. التحقق من المعاملات
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('sellerId')
    const currentProductId = searchParams.get('currentProductId')
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!sellerId || !currentProductId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: sellerId and currentProductId are required' 
        },
        { status: 400 }
      )
    }

    // 2. إنشاء عميل Supabase
    const supabase = await createRouteHandlerClient()

    // 3. جلب التوصيات
    const products = await getRecommendations(supabase, {
      sellerId,
      currentProductId,
      limit
    })

    // 4. حساب الإحصائيات
    const mainCategoryId = await getCurrentProductMainCategory(supabase, currentProductId)
    const stats = calculateStats(products, mainCategoryId)

    // 5. تسجيل الأداء
    const executionTime = Date.now() - startTime
    console.log(`✅ Recommendations API: ${products.length} products in ${executionTime}ms`)

    // 6. إرجاع النتيجة
    return NextResponse.json({
      success: true,
      data: products,
      stats,
      performance: {
        executionTime: `${executionTime}ms`,
        cacheHit: false
      }
    })

  } catch (error: any) {
    console.error('🔥 Recommendations API Error:', {
      error: error.message,
      url: request.url,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}