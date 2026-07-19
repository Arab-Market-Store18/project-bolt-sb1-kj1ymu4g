/**
 * API نقطة نهاية الاقتراحات التلقائية (Autocomplete Endpoint)
 * توفر اقتراحات فورية أثناء الكتابة
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAutocomplete, generateContextualSuggestions } from '@/lib/search/autocomplete-engine';
import { correctTypos } from '@/lib/arabic-search-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const withContext = searchParams.get('context') === '1';

    // ✓ التحقق من طول الكلمة المدخلة
    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        suggestions: [],
        popular: [],
        corrected: null,
        hasErrors: false,
        executionTime: `${Date.now() - startTime}ms`,
      });
    }

    // ✓ تصحيح الأخطاء الفوري
    const correctedQuery = correctTypos(query);

    let suggestions, popular, corrected, hasErrors;

    // ✓ الاقتراحات العادية أو السياقية
    if (withContext) {
      suggestions = await generateContextualSuggestions(correctedQuery);
      popular = [];
      corrected = correctedQuery !== query ? correctedQuery : null;
      hasErrors = corrected !== null;
    } else {
      const result = await generateAutocomplete(correctedQuery, limit);
      suggestions = result.suggestions;
      popular = result.popular;
      corrected = result.corrected;
      hasErrors = result.hasErrors;
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json(
      {
        query: correctedQuery,
        original_query: query,
        suggestions: suggestions.slice(0, limit),
        popular: popular.slice(0, Math.max(0, limit - suggestions.length)),
        corrected,
        hasErrors,
        executionTime: `${executionTime}ms`,
      },
      {
        headers: {
          // تخزين مؤقت لمدة 10 دقائق
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    console.error('[API Autocomplete] Error:', error);
    return NextResponse.json(
      {
        error: 'خطأ في الاقتراحات التلقائية',
        suggestions: [],
        popular: [],
        executionTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}
