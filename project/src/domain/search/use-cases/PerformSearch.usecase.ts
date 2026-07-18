// src/domain/search/use-cases/PerformSearch.usecase.ts

import type { SearchResult } from '../entities/SearchResult';
import type { ISearchProvider } from '../ports/outgoing/SearchProvider.port.ts';
import { SearchCriteria } from '../value-objects/SearchCriteria';
import { SearchResultsCollection } from '../entities/SearchResult';

export interface SearchOptions {
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export class PerformSearchUseCase {
  constructor(private readonly searchProvider: ISearchProvider) {}

  private convertParamsToCriteria(params: URLSearchParams): SearchCriteria {
    const query = params.get('q') || '';
    const page  = parseInt(params.get('page') || '1');
    const limit = parseInt(params.get('limit') || '20');
    return SearchCriteria.create({ query, page, limit });
  }

  public async execute(
    params: URLSearchParams | SearchCriteria,
    options: SearchOptions = {}
  ): Promise<SearchResultsCollection> {

    const criteria = params instanceof URLSearchParams
      ? this.convertParamsToCriteria(params)
      : params;

    const page  = criteria.pagination?.page  || 1;
    const limit = options.limit ?? criteria.pagination?.limit ?? 20;

    if (!criteria.query) {
      return new SearchResultsCollection([], 0, page, limit, '');
    }

    const trimmedQuery = criteria.query.trim();
    if (trimmedQuery.length < 2) {
      return new SearchResultsCollection([], 0, page, limit, trimmedQuery);
    }

    try {
      // 1. إنشاء embedding للبحث الدلالي
      const embedding = await this.searchProvider.createEmbedding(trimmedQuery);

      // 2. تنفيذ البحث الهجين مع خيارات الفلترة والترتيب
      const allResults = await this.searchProvider.hybridSearch(
        trimmedQuery,
        embedding,
        {
          sort:     options.sort,
          minPrice: options.minPrice,
          maxPrice: options.maxPrice,
          limit:    limit * 3, // نجلب أكثر ثم نقسّم للصفحات
        }
      );

      // 3. تقسيم الصفحات
      const startIndex = (page - 1) * limit;
      const paginatedResults = allResults.slice(startIndex, startIndex + limit);

      return new SearchResultsCollection(
        paginatedResults,
        allResults.length,
        page,
        limit,
        trimmedQuery
      );

    } catch (error) {
      console.error('[PerformSearchUseCase] خطأ:', error);
      return new SearchResultsCollection([], 0, page, limit, trimmedQuery);
    }
  }
}
