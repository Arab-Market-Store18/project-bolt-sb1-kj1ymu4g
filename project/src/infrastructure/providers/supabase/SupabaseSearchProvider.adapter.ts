// src/infrastructure/providers/supabase/SupabaseSearchProvider.adapter.ts

import { ISearchProvider } from '@/domain/search/ports/outgoing/SearchProvider.port';
import { SearchResult } from '@/domain/search/entities/SearchResult';
import { supabase } from './SupabaseClient';
import {
  normalizeArabicText,
  expandQueryWithSynonyms,
  correctTypos,
  splitCompoundWords,
  detectSearchIntent,
} from '@/lib/arabic-search-utils';

// ========== نموذج Embedding الدلالي ==========
let transformers: any = null;

class EmbeddingPipeline {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance: any = null;
  static isInitialized = false;
  static initializationError: Error | null = null;

  static async getInstance() {
    if (this.initializationError) throw this.initializationError;

    if (this.instance === null && !this.isInitialized) {
      this.isInitialized = true;
      try {
        if (!transformers) {
          transformers = await import('@xenova/transformers');
        }
        this.instance = await transformers.pipeline(this.task, this.model, {
          revision: 'main',
          quantized: true,
        });
        console.log('✅ [EmbeddingPipeline] النموذج محمل بنجاح');
      } catch (error: any) {
        console.error('❌ [EmbeddingPipeline] فشل تحميل النموذج:', error.message);
        this.initializationError = error;
        this.instance = { fake: true };
      }
    }
    return this.instance;
  }

  static async createEmbeddingSafe(text: string): Promise<number[]> {
    try {
      const generator = await this.getInstance();
      if (generator?.fake) throw new Error('النموذج غير متاح');
      const output = await generator(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch {
      return Array(384).fill(0).map((_, i) => Math.sin(i * 0.1) * 0.1);
    }
  }
}

// ========== مزود البحث الرئيسي ==========
export class SupabaseSearchProvider implements ISearchProvider {
  private useAdvancedSearch = true;

  public async createEmbedding(text: string): Promise<number[]> {
    if (!this.useAdvancedSearch) return this.createFallbackEmbedding();
    try {
      return await EmbeddingPipeline.createEmbeddingSafe(text);
    } catch {
      this.useAdvancedSearch = false;
      return this.createFallbackEmbedding();
    }
  }

  private createFallbackEmbedding(): number[] {
    return Array(384).fill(0.1);
  }

  public async hybridSearch(
    query: string,
    embedding: number[],
    options: {
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
      limit?: number;
    } = {}
  ): Promise<SearchResult[]> {

    // ===== المحطة الثانية: تنقية وتجهيز الاستعلام =====
    const corrected = correctTypos(query);
    const expanded = splitCompoundWords(corrected);
    const normalized = normalizeArabicText(expanded);
    const synonymTerms = expandQueryWithSynonyms(expanded);
    const intent = detectSearchIntent(query);

    console.log(`🔍 [Search] "${query}" → normalized: "${normalized}", intent: ${intent}, synonyms: ${synonymTerms.length}`);

    try {
      // ===== المحطة الثالثة: البحث في الفهرس =====

      // 1. البحث الدلالي (إذا كان النموذج يعمل)
      let semanticResults: any[] = [];
      if (this.useAdvancedSearch && embedding.length > 0) {
        try {
          const { data, error } = await supabase.rpc('match_products_and_services', {
            query_embedding: embedding,
            match_threshold: 0.25,
            match_count: 15,
          });
          if (!error && data) semanticResults = data;
        } catch {
          // تجاهل - نكمل بالبحث النصي
        }
      }

      // 2. بناء استعلام البحث النصي الموسّع بالمرادفات
      const orConditions = synonymTerms
        .slice(0, 6) // حد أقصى 6 مرادفات لتجنب الاستعلامات البطيئة
        .flatMap(term => [
          `name.ilike.%${term}%`,
          `description.ilike.%${term}%`,
        ])
        .join(',');

      let keywordQuery = supabase
        .from('products')
        .select('*')
        .or(orConditions)
        .limit(options.limit || 20);

      // تطبيق فلتر السعر
      if (options.minPrice !== undefined && options.minPrice > 0) {
        keywordQuery = keywordQuery.gte('price', options.minPrice);
      }
      if (options.maxPrice !== undefined && options.maxPrice < 100000) {
        keywordQuery = keywordQuery.lte('price', options.maxPrice);
      }

      const { data: keywordResults } = await keywordQuery;

      // ===== دمج وإزالة التكرار =====
      const allResults = [...semanticResults, ...(keywordResults || [])];
      const uniqueResults = this.removeDuplicates(allResults);

      // ===== المحطة الرابعة: الترتيب الذكي =====
      const scored = uniqueResults.map(record => ({
        ...record,
        _finalScore: this.calculateAdvancedScore(record, query, normalized, synonymTerms, intent),
      }));

      // الترتيب حسب خيار المستخدم أو الترتيب الذكي الافتراضي
      const sortedResults = this.sortResults(scored, options.sort || 'best_match');

      return this.mapToSearchResults(sortedResults, query);

    } catch (error: any) {
      console.error('❌ [Search] خطأ في hybridSearch:', error);
      return this.fallbackTextSearch(query);
    }
  }

  // ===== حساب درجة الملاءمة المتقدمة =====
  private calculateAdvancedScore(
    record: any,
    originalQuery: string,
    normalizedQuery: string,
    synonymTerms: string[],
    intent: string
  ): number {
    let score = record.similarity || 0;

    const titleNorm = normalizeArabicText(record.name || '');
    const descNorm = normalizeArabicText(record.description || '');

    // وزن العنوان أعلى من الوصف (كما في المقال: العنوان أولاً)
    if (titleNorm.includes(normalizedQuery)) score += 0.4;
    if (titleNorm === normalizedQuery) score += 0.3; // تطابق كامل
    if (descNorm.includes(normalizedQuery)) score += 0.15;

    // وزن المرادفات
    for (const term of synonymTerms.slice(0, 3)) {
      const termNorm = normalizeArabicText(term);
      if (titleNorm.includes(termNorm)) score += 0.1;
      if (descNorm.includes(termNorm)) score += 0.05;
    }

    // وزن الجدة: المنتجات الحديثة تحصل على دفعة
    if (record.created_at) {
      const daysOld = (Date.now() - new Date(record.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 0.15;
      else if (daysOld < 30) score += 0.08;
      else if (daysOld < 90) score += 0.03;
    }

    // وزن الشعبية (عدد الإعجابات)
    if (record.likes_count && record.likes_count > 0) {
      score += Math.min(record.likes_count / 100, 0.1);
    }

    // تعديل حسب النية
    if (intent === 'newest' && record.created_at) {
      const daysOld = (Date.now() - new Date(record.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, (90 - daysOld) / 90) * 0.2;
    }

    return Math.min(score, 1.0);
  }

  // ===== ترتيب النتائج =====
  private sortResults(results: any[], sortBy: string): any[] {
    switch (sortBy) {
      case 'price_low':
        return results.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_high':
        return results.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'newest':
        return results.sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      case 'top_rated':
        return results.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case 'best_match':
      default:
        return results.sort((a, b) => (b._finalScore || 0) - (a._finalScore || 0));
    }
  }

  private async fallbackTextSearch(query: string): Promise<SearchResult[]> {
    const { data } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);
    return this.mapToSearchResults(data || [], query);
  }

  private removeDuplicates(results: any[]): any[] {
    const seen = new Set();
    return results.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  private mapToSearchResults(records: any[], originalQuery: string): SearchResult[] {
    return records
      .map((record: any) => {
        try {
          return SearchResult.create({
            id: String(record.id),
            title: record.name || 'بدون عنوان',
            description: record.description || null,
            imageUrl: this.extractFirstImage(record.images) || record.image_url || null,
            price: record.price || 0,
            currency: record.currency || 'ر.س',
            type: 'product',
            score: record._finalScore || record.similarity || 0.5,
          });
        } catch {
          return null;
        }
      })
      .filter(Boolean) as SearchResult[];
  }

  private extractFirstImage(images: any): string | null {
    if (!images) return null;
    if (typeof images === 'string') return images;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      return typeof first === 'string' ? first : first?.url || first?.src || null;
    }
    if (typeof images === 'object') {
      return images.url || images.src || images[0] || null;
    }
    return null;
  }

  public async search(criteria: { query: string }): Promise<SearchResult[]> {
    const embedding = await this.createEmbedding(criteria.query);
    return this.hybridSearch(criteria.query, embedding);
  }
}
