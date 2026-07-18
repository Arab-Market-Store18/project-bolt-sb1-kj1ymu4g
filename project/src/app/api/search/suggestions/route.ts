// src/app/api/search/suggestions/route.ts
// API للاقتراحات الفورية أثناء الكتابة

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/infrastructure/providers/supabase/SupabaseClient';
import { normalizeArabicText, POPULAR_SEARCHES } from '@/lib/arabic-search-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || '';

  // إرجاع البحثات الشائعة إذا كان الاستعلام فارغاً
  if (!query || query.trim().length < 1) {
    return NextResponse.json({
      suggestions: POPULAR_SEARCHES.slice(0, 8),
      type: 'popular',
    });
  }

  const normalizedQuery = normalizeArabicText(query.trim());

  try {
    // البحث في أسماء المنتجات للحصول على اقتراحات حقيقية
    const { data: products } = await supabase
      .from('products')
      .select('name')
      .ilike('name', `%${query}%`)
      .limit(6);

    // تجميع الاقتراحات
    const productSuggestions = (products || [])
      .map((p: { name: string }) => p.name)
      .filter((name: string) => name && name.toLowerCase() !== query.toLowerCase());

    // إضافة اقتراحات من القائمة الشائعة التي تطابق البحث
    const popularMatches = POPULAR_SEARCHES.filter(s =>
      normalizeArabicText(s).includes(normalizedQuery) ||
      s.toLowerCase().includes(query.toLowerCase())
    );

    // دمج الاقتراحات وإزالة المكررات
    const combined = [...new Set([...productSuggestions, ...popularMatches])].slice(0, 8);

    return NextResponse.json(
      {
        suggestions: combined,
        type: combined.length > 0 ? 'matched' : 'empty',
        query,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    // fallback: اقتراحات شائعة عند الخطأ
    return NextResponse.json({
      suggestions: POPULAR_SEARCHES.slice(0, 6),
      type: 'popular',
    });
  }
}
