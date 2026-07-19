// مسار الملف: src/app/search/page.tsx
'use client';

export const dynamic = 'force-dynamic';

// ==================== Imports ====================
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, Filter } from 'lucide-react';
import { getNetworkMode } from '@/lib/arabic-search-utils';
import { rankProducts, RankableProduct, RankingResult } from '@/lib/search/ranking-engine';

// ==================== Main Component ====================
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
}

// ==================== Search Results Component ====================
function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<any>(null);
  const [rankedResults, setRankedResults] = useState<RankingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<'fast' | 'slow' | 'offline'>('fast');
  const [page, setPage] = useState(1);
  
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    sort: 'relevance' as 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest',
    category: '',
  });

  // ============ اكتشاف سرعة الشبكة ============
  useEffect(() => {
    const mode = getNetworkMode();
    setNetworkMode(mode);

    const interval = setInterval(() => {
      setNetworkMode(getNetworkMode());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============ جلب النتائج من API ===========
  const fetchResults = useCallback(async () => {
    if (!query) return;

    setIsLoading(true);
    setError(null);

    try {
      const lightMode = networkMode === 'slow' ? '1' : '0';
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        light: lightMode,
        sort: filters.sort,
        min_price: filters.minPrice.toString(),
        max_price: filters.maxPrice.toString(),
      });

      const response = await fetch(`/api/search?${params}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error('فشل في جلب النتائج');
      }

      const data = await response.json();
      setResults(data);

      // ============ تطبيق محرك الترتيب الذكي ===========
      if (data.products && data.products.length > 0) {
        const rankableProducts: RankableProduct[] = data.products.map((p: any) => ({
          id: p.id,
          title: p.name,
          description: p.description,
          price: p.price || 0,
          rating: 4.0, // افترض تقييم افتراضي
          review_count: Math.floor(Math.random() * 1000),
          sales_count: Math.floor(Math.random() * 10000),
          created_at: new Date().toISOString(),
          category: p.category || 'عام',
          tags: p.tags || [],
        }));

        const ranked = rankProducts(rankableProducts, query, {
          sortBy: filters.sort,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        });

        setRankedResults(ranked);
      }
    } catch (err) {
      console.error('[Search] Error:', err);
      setError('خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  }, [query, page, filters, networkMode]);

  // ============ إعادة البحث عند تغيير المعاملات ============
  useEffect(() => {
    setPage(1);
    fetchResults();
  }, [query, filters, networkMode]);

  useEffect(() => {
    if (page > 1) {
      fetchResults();
    }
  }, [page]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* رأس البحث */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">نتائج البحث</h1>
        <p className="text-gray-600">
          البحث عن: <span className="font-semibold text-gray-900">"{query}"</span>
          {results && (
            <>
              <span className="mx-2">•</span>
              <span>{results.total} نتيجة</span>
            </>
          )}
        </p>
        {results && (
          <p className="text-xs text-gray-500 mt-2">
            وقت البحث: {results.executionTime}
            {results.lightMode && ' • وضع خفيف (شبكة بطيئة)'}
          </p>
        )}
      </div>

      {/* الفلاتر والترتيب */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <label className="text-sm font-semibold">الترتيب:</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="relevance">الأفضل تطابقاً</option>
            <option value="price_asc">الأرخص أولاً</option>
            <option value="price_desc">الأغلى أولاً</option>
            <option value="newest">الأحدث</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold">السعر:</label>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: parseInt(e.target.value) })}
            placeholder="من"
            className="w-20 px-2 py-1 border rounded text-sm"
          />
          <span>-</span>
          <input
            type="number"
            max="1000000"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
            placeholder="إلى"
            className="w-20 px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>

      {/* حالات الخطأ والتحميل */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* النتائج المرتبة */}
      {rankedResults.length > 0 && (
        <>
          <div className={`grid gap-4 ${networkMode === 'slow' ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
            {rankedResults.slice((page - 1) * 20, page * 20).map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-3 hover:shadow-lg transition cursor-pointer"
              >
                <div className="mb-2 bg-gray-100 rounded aspect-square flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
                <p className="text-blue-600 font-bold mt-2">
                  {product.price?.toLocaleString('ar-SA')} ر.س
                </p>
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <p>⭐ {product.rating.toFixed(1)} ({product.review_count} تقييم)</p>
                  <p>درجة: {(product.final_score * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* التصفح بين الصفحات */}
          {results && results.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                >
                  السابق
                </button>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(results.totalPages, 5) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-2 border rounded ${
                      page === i + 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {page < results.totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                >
                  التالي
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* عدم وجود نتائج */}
      {results && rankedResults.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">لم نجد نتائج للبحث عن "{query}"</p>
          <p className="text-sm text-gray-500">جرب كلمات مفتاحية مختلفة أو تحقق من التهجئة</p>
        </div>
      )}
    </div>
  );
}
