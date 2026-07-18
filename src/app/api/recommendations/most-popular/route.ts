// استبدل الكود الحالي بهذا الكود المؤقت
import { createRouteHandlerClient } from '@/lib/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    // 🔧 [إصلاح] استعلام مبسط
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        currency,
        discount_price,
        images,
        thumbnail_image_url,
        likes_count,
        condition,
        stock,
        category_id,
        main_category_id,
        sales_count,
        sellers (
          business_name,
          logo_url,
          city,
          country
        )
      `)
      .eq('is_active', true)
      .eq('is_approved', true)
      .not('stock', 'eq', 0)
      .order('likes_count', { ascending: false })
      .order('sales_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        note: 'جاري تطوير النظام'
      });
    }
    return NextResponse.json({
      success: true,
      data: products || [],
      count: products?.length || 0
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      note: 'جاري تحسين النظام'
    });
  }
}
