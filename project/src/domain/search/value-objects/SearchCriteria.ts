// src/domain/search/value-objects/SearchCriteria.ts

// src/domain/search/value-objects/SearchCriteria.ts

import { Pagination } from './Pagination';

export class SearchCriteria {
  public readonly query: string;
  public readonly pagination: Pagination;
  // يمكن إضافة المزيد من المعايير هنا مستقبلاً، مثل الفلاتر أو الترتيب
  // public readonly filters?: Record<string, any>;

  private constructor(props: { query: string; pagination: Pagination }) {
    this.query = props.query;
    this.pagination = props.pagination;
  }

  public static create(props: { query: string; page?: number; limit?: number }): SearchCriteria {
    if (!props.query || props.query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long.');
    }
    
    const pagination = Pagination.create({ page: props.page, limit: props.limit });
    
    return new SearchCriteria({ query: props.query.trim(), pagination });
  }
}
