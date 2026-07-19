/**
 * طبقة التخزين المؤقت Redis لنظام البحث المتطور
 * تتعامل مع تخزين النتائج والاقتراحات والفهارس بكفاءة عالية
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ==================== ثوابت التخزين المؤقت ====================
const CACHE_KEYS = {
  SEARCH_RESULTS: (query: string, page: number) => `search:results:${query}:p${page}`,
  AUTOCOMPLETE: (prefix: string) => `search:autocomplete:${prefix}`,
  POPULAR_SEARCHES: 'search:popular:list',
  SEARCH_TRENDING: 'search:trending:list',
  FACETS: (category: string) => `search:facets:${category}`,
  PRODUCT_INDEX: 'search:product:index',
  SYNONYMS_CACHE: 'search:synonyms:cache',
};

const CACHE_TTL = {
  SEARCH_RESULTS: 3600, // ساعة واحدة
  AUTOCOMPLETE: 7200, // ساعتان
  TRENDING: 1800, // 30 دقيقة
  FACETS: 3600, // ساعة واحدة
};

// ==================== دالة التخزين المؤقت للنتائج ====================
export async function cacheSearchResults(
  query: string,
  page: number,
  results: any,
  ttl = CACHE_TTL.SEARCH_RESULTS
): Promise<void> {
  try {
    const key = CACHE_KEYS.SEARCH_RESULTS(query, page);
    const compressed = JSON.stringify(results);
    await redis.setex(key, ttl, compressed);
    console.log(`[Redis Cache] حفظ نتائج البحث: ${key}`);
  } catch (error) {
    console.error('[Redis Cache] فشل في حفظ النتائج:', error);
    // لا نرمي الخطأ - البحث يجب أن يعمل حتى بدون Redis
  }
}

// ==================== دالة استرجاع النتائج المخزنة ====================
export async function getSearchResultsCache(query: string, page: number): Promise<any | null> {
  try {
    const key = CACHE_KEYS.SEARCH_RESULTS(query, page);
    const cached = await redis.get(key);
    if (cached) {
      console.log(`[Redis Cache] استرجاع نتائج مخزنة: ${key}`);
      return JSON.parse(cached as string);
    }
    return null;
  } catch (error) {
    console.error('[Redis Cache] فشل في استرجاع النتائج:', error);
    return null;
  }
}

// ==================== الاقتراحات التلقائية ====================
export async function cacheAutocomplete(prefix: string, suggestions: string[]): Promise<void> {
  try {
    const key = CACHE_KEYS.AUTOCOMPLETE(prefix);
    // تخزين فقط أفضل 10 اقتراحات لتوفير المساحة
    const top10 = suggestions.slice(0, 10);
    await redis.setex(key, CACHE_TTL.AUTOCOMPLETE, JSON.stringify(top10));
    console.log(`[Redis Cache] حفظ اقتراحات: ${prefix}`);
  } catch (error) {
    console.error('[Redis Cache] فشل في حفظ الاقتراحات:', error);
  }
}

export async function getAutocompleteCache(prefix: string): Promise<string[] | null> {
  try {
    const key = CACHE_KEYS.AUTOCOMPLETE(prefix);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached as string) : null;
  } catch (error) {
    console.error('[Redis Cache] فشل في استرجاع الاقتراحات:', error);
    return null;
  }
}

// ==================== قائمة البحث الشعبية ====================
export async function updatePopularSearches(searches: string[]): Promise<void> {
  try {
    const key = CACHE_KEYS.POPULAR_SEARCHES;
    await redis.setex(key, CACHE_TTL.TRENDING, JSON.stringify(searches.slice(0, 50)));
    console.log(`[Redis Cache] تحديث البحث الشعبي: ${searches.length} بحث`);
  } catch (error) {
    console.error('[Redis Cache] فشل في تحديث البحث الشعبي:', error);
  }
}

export async function getPopularSearches(): Promise<string[]> {
  try {
    const key = CACHE_KEYS.POPULAR_SEARCHES;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached as string) : [];
  } catch (error) {
    console.error('[Redis Cache] فشل في استرجاع البحث الشعبي:', error);
    return [];
  }
}

// ==================== تتبع البحث الشائع ====================
export async function incrementSearchCounter(query: string): Promise<void> {
  try {
    const counterKey = `search:counter:${query}`;
    await redis.incr(counterKey);
    await redis.expire(counterKey, 86400); // 24 ساعة
  } catch (error) {
    console.error('[Redis Cache] فشل في تحديث عداد البحث:', error);
  }
}

// ==================== تخزين مؤقت للفهارس ====================
export async function cacheFacets(category: string, facets: any): Promise<void> {
  try {
    const key = CACHE_KEYS.FACETS(category);
    await redis.setex(key, CACHE_TTL.FACETS, JSON.stringify(facets));
    console.log(`[Redis Cache] حفظ الفهارس: ${category}`);
  } catch (error) {
    console.error('[Redis Cache] فشل في حفظ الفهارس:', error);
  }
}

export async function getFacetsCache(category: string): Promise<any | null> {
  try {
    const key = CACHE_KEYS.FACETS(category);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached as string) : null;
  } catch (error) {
    console.error('[Redis Cache] فشل في استرجاع الفهارس:', error);
    return null;
  }
}

// ==================== تنظيف الكاش ====================
export async function invalidateSearchCache(query: string): Promise<void> {
  try {
    // حذف جميع صفحات النتيجة لهذا البحث
    for (let page = 1; page <= 10; page++) {
      const key = CACHE_KEYS.SEARCH_RESULTS(query, page);
      await redis.del(key);
    }
    console.log(`[Redis Cache] تنظيف كاش البحث: ${query}`);
  } catch (error) {
    console.error('[Redis Cache] فشل في تنظيف الكاش:', error);
  }
}

// ==================== إحصائيات الكاش ====================
export async function getCacheStats(): Promise<{
  keys_count: number;
  memory_usage: string;
  hit_rate: number;
}> {
  try {
    const info = await redis.dbsize();
    return {
      keys_count: info,
      memory_usage: 'N/A',
      hit_rate: 0,
    };
  } catch (error) {
    console.error('[Redis Cache] فشل في الحصول على الإحصائيات:', error);
    return { keys_count: 0, memory_usage: '0', hit_rate: 0 };
  }
}

// ==================== مسح البيانات القديمة ====================
export async function cleanupOldCache(): Promise<void> {
  try {
    console.log('[Redis Cache] بدء تنظيف البيانات القديمة...');
    // يتم تنفيذ هذا بواسطة TTL التلقائي في Upstash
    const stats = await getCacheStats();
    console.log(`[Redis Cache] الإحصائيات: ${JSON.stringify(stats)}`);
  } catch (error) {
    console.error('[Redis Cache] فشل في التنظيف:', error);
  }
}

export default redis;
