/**
 * محرك الترتيب الذكي (Ranking Engine)
 * يرتب نتائج البحث بناءً على عوامل متعددة مثل الصلة والشعبية والتقييمات
 */

import { detectSearchIntent, SearchIntent } from '@/lib/arabic-search-utils';
import { calculateCombinedScore } from './string-similarity';

// ==================== تعريف أنواع النتائج ====================
export interface RankableProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  rating: number;
  review_count: number;
  sales_count: number;
  created_at: string;
  category: string;
  tags?: string[];
  is_new?: boolean;
  is_sponsored?: boolean;
  relevance_score?: number;
}

export interface RankingResult extends RankableProduct {
  final_score: number;
  score_breakdown: {
    relevance: number;
    popularity: number;
    quality: number;
    freshness: number;
    price_bonus: number;
  };
}

// ==================== الأوزان والعوامل ====================
const RANKING_WEIGHTS = {
  relevance: 0.35,      // تطابق البحث
  popularity: 0.25,     // عدد المبيعات والمشاهدات
  quality: 0.20,        // التقييمات والتقيمات
  freshness: 0.10,      // حداثة المنتج
  price_bonus: 0.10,    // عامل السعر حسب النية
};

const QUALITY_THRESHOLDS = {
  excellent: 4.5,
  good: 3.5,
  average: 2.5,
  poor: 1.0,
};

const FRESHNESS_DAYS = 30; // منتجات جديدة خلال آخر 30 يوم

// ==================== حساب درجة الصلة ====================
export function calculateRelevanceScore(
  product: RankableProduct,
  query: string,
  queryTerms: string[]
): number {
  const titleMatch = calculateCombinedScore(query, product.title);
  const descriptionMatch = product.description
    ? calculateCombinedScore(query, product.description) * 0.5 // وزن أقل
    : 0;
  const tagMatch = product.tags?.length
    ? product.tags.filter(tag => 
        queryTerms.some(term => 
          calculateCombinedScore(term, tag) > 0.6
        )
      ).length / (product.tags.length || 1) * 0.8
    : 0;

  // الصلة = الأقصى من التطابقات
  return Math.max(titleMatch, descriptionMatch, tagMatch);
}

// ==================== حساب درجة الشعبية ====================
export function calculatePopularityScore(product: RankableProduct): number {
  // تطبيع المبيعات والمشاهدات
  const salesScore = Math.min(product.sales_count / 10000, 1);
  
  // معادلة لوغاريتمية تقلل تأثير الأرقام الكبيرة جداً
  const normalizedSales = Math.log(1 + salesScore) / Math.log(2);
  
  return Math.min(normalizedSales, 1);
}

// ==================== حساب درجة الجودة ====================
export function calculateQualityScore(product: RankableProduct): number {
  // التقييم يساهم 70%
  const ratingScore = product.rating / 5;
  
  // عدد التقييمات يساهم 30%
  // كلما زاد عدد التقييمات، أكثر موثوقية
  const reviewScore = Math.min(product.review_count / 100, 1) * 0.3;
  
  return ratingScore * 0.7 + reviewScore;
}

// ==================== حساب درجة الحداثة ====================
export function calculateFreshnessScore(product: RankableProduct): number {
  const createdDate = new Date(product.created_at);
  const daysSinceCreation = Math.floor(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // منتجات جديدة جداً (أقل من 7 أيام) تحصل على أعلى درجة
  if (daysSinceCreation <= 7) return 1;
  
  // منتجات حديثة (أقل من 30 يوم) تحصل على درجة عالية
  if (daysSinceCreation <= FRESHNESS_DAYS) {
    return 1 - (daysSinceCreation - 7) / (FRESHNESS_DAYS - 7) * 0.7;
  }

  // منتجات قديمة تحصل على درجة منخفضة
  return Math.max(0, 1 - (daysSinceCreation - FRESHNESS_DAYS) / 365);
}

// ==================== حساب مكافأة السعر ====================
export function calculatePriceBonus(
  product: RankableProduct,
  intent: SearchIntent
): number {
  // إذا كان البحث عن الأرخص
  if (intent === 'price_low') {
    // المنتجات الأرخص تحصل على تعزيز
    // افترض الحد الأقصى للسعر هو 10,000
    return Math.max(0, 1 - (product.price / 10000));
  }

  // إذا كان البحث عن الفاخر
  if (intent === 'price_high') {
    // المنتجات الأغلى تحصل على تعزيز (افترض سعر متوسط 2000)
    return Math.min(1, product.price / 2000 * 0.5);
  }

  // بحث عام - السعر المتوسط يحصل على أفضل درجة
  const targetPrice = 2000;
  const deviation = Math.abs(product.price - targetPrice) / targetPrice;
  return Math.max(0, 1 - deviation * 0.5);
}

// ==================== الدالة الرئيسية للترتيب ====================
export function rankProducts(
  products: RankableProduct[],
  query: string,
  userPreferences?: {
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
    minPrice?: number;
    maxPrice?: number;
    categories?: string[];
  }
): RankingResult[] {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const intent = detectSearchIntent(query);

  const rankedProducts: RankingResult[] = products
    .map(product => {
      // حساب كل مكون من درجة الترتيب
      const relevance = calculateRelevanceScore(product, query, queryTerms);
      const popularity = calculatePopularityScore(product);
      const quality = calculateQualityScore(product);
      const freshness = calculateFreshnessScore(product);
      const priceBonus = calculatePriceBonus(product, intent);

      // حساب الدرجة النهائية
      const finalScore = (
        relevance * RANKING_WEIGHTS.relevance +
        popularity * RANKING_WEIGHTS.popularity +
        quality * RANKING_WEIGHTS.quality +
        freshness * RANKING_WEIGHTS.freshness +
        priceBonus * RANKING_WEIGHTS.price_bonus
      );

      return {
        ...product,
        final_score: finalScore,
        score_breakdown: {
          relevance: relevance * RANKING_WEIGHTS.relevance,
          popularity: popularity * RANKING_WEIGHTS.popularity,
          quality: quality * RANKING_WEIGHTS.quality,
          freshness: freshness * RANKING_WEIGHTS.freshness,
          price_bonus: priceBonus * RANKING_WEIGHTS.price_bonus,
        },
      };
    })
    .filter(product => {
      // تطبيق الفلاتر
      if (userPreferences) {
        if (userPreferences.minPrice && product.price < userPreferences.minPrice) return false;
        if (userPreferences.maxPrice && product.price > userPreferences.maxPrice) return false;
        if (userPreferences.categories && !userPreferences.categories.includes(product.category)) {
          return false;
        }
      }
      return true;
    });

  // ترتيب حسب التفضيل
  if (userPreferences?.sortBy) {
    switch (userPreferences.sortBy) {
      case 'price_asc':
        rankedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        rankedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        rankedProducts.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);
        break;
      case 'newest':
        rankedProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'relevance':
      default:
        rankedProducts.sort((a, b) => b.final_score - a.final_score);
    }
  } else {
    // الترتيب الافتراضي: حسب الدرجة النهائية
    rankedProducts.sort((a, b) => b.final_score - a.final_score);
  }

  return rankedProducts;
}

// ==================== دالة مساعدة للحصول على ملخص الترتيب ====================
export function getScoreSummary(result: RankingResult): string {
  const breakdown = result.score_breakdown;
  const parts = [];
  
  if (breakdown.relevance > 0.1) parts.push(`صلة: ${(breakdown.relevance * 100).toFixed(0)}%`);
  if (breakdown.quality > 0.1) parts.push(`جودة: ${(breakdown.quality * 100).toFixed(0)}%`);
  if (breakdown.popularity > 0.1) parts.push(`شعبية: ${(breakdown.popularity * 100).toFixed(0)}%`);
  if (breakdown.freshness > 0.05) parts.push(`جديد: ${(breakdown.freshness * 100).toFixed(0)}%`);
  
  return parts.join(', ');
}

export default rankProducts;
