// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { performSearchUseCase } from '@/app/composition-root';
import { SearchCriteria } from '@/domain/search/value-objects/SearchCriteria';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const query     = searchParams.get('q') || '';
    const page      = parseInt(searchParams.get('page') || '1');
    const sort      = searchParams.get('sort') || 'best_match';
    const minPrice  = parseFloat(searchParams.get('min_price') || '0');
    const maxPrice  = parseFloat(searchParams.get('max_price') || '100000');

    // وضع الشبكة الخفيفة: إذا طلب العميل وضع بطيء، نقلل النتائج
    const lightMode = searchParams.get('light') === '1';
    const limit     = lightMode ? 5 : parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        products: [], total: 0, page: 1, pageSize: limit,
        totalPages: 0, hasNextPage: false, hasPreviousPage: false,
        facets: null, query,
        message: 'يرجى إدخال مصطلح بحث يتكون من حرفين على الأقل',
      });
    }

    const criteria = SearchCriteria.create({ query, page, limit });

    // تمرير خيارات الترتيب والفلترة إلى Use Case
    const results = await performSearchUseCase.execute(criteria, {
      sort,
      minPrice,
      maxPrice,
      limit,
    });

    const executionTime = Date.now() - startTime;

    const products = results.results
      .map(result => {
        if (!result.id || !result.title) return null;
        return {
          id: result.id,
          name: result.title,
          description: result.description || '',
          image_url: result.imageUrl,
          price: result.price || 0,
          currency: result.currency || 'ر.س',
          type: result.type || 'product',
          relevance_score: result.score || 0.5,
          seller: null,
          category_id: null,
          tags: [],
          created_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      {
        products,
        total: results.total,
        page: results.page,
        pageSize: results.pageSize,
        totalPages: results.totalPages,
        hasNextPage: results.hasNextPage,
        hasPreviousPage: results.hasPreviousPage,
        facets: { breadcrumbs: [], mainCategories: [], subCategories: [] },
        query: results.query,
        executionTime: `${executionTime}ms`,
        lightMode,
      },
      {
        headers: {
          // تخزين مؤقت 2 دقيقة للنتائج على CDN
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[API Search] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'خطأ في البحث',
        products: [], total: 0, page: 1, pageSize: 20,
        totalPages: 0, hasNextPage: false, hasPreviousPage: false,
        facets: null, executionTime: `${executionTime}ms`,
      },
      { status: 500 }
    );
  }
}
