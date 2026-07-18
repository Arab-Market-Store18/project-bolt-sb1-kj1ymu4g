// إذا كان SearchResult.ts فارغاً أو تالفاً، أنشئه من جديد:

// المسار: src/domain/search/entities/SearchResult.ts
export class SearchResult {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string | null;
  public readonly imageUrl: string | null;
  public readonly price: number;
  public readonly currency: string;
  public readonly type: 'product' | 'service';
  public readonly score?: number;

  private constructor(props: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    price: number;
    currency: string;
    type: 'product' | 'service';
    score?: number;
  }) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.imageUrl = props.imageUrl;
    this.price = props.price;
    this.currency = props.currency;
    this.type = props.type;
    this.score = props.score;
  }

  public static create(props: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number;
    currency: string;
    type: 'product' | 'service';
    score?: number;
  }): SearchResult {
    if (props.price < 0) {
      throw new Error('السعر لا يمكن أن يكون سالباً.');
    }

    return new SearchResult({
      ...props,
      description: props.description ?? null,
      imageUrl: props.imageUrl ?? null,
    });
  }
}

export class SearchResultsCollection {
constructor(
  public readonly results: SearchResult[],
  public readonly total: number,
  public readonly page: number,
  public readonly pageSize: number,
  public readonly query: string
) {}

public get totalPages(): number {
  return Math.ceil(this.total / this.pageSize);
}

public get hasNextPage(): boolean {
  return this.page < this.totalPages;
}

public get hasPreviousPage(): boolean {
  return this.page > 1;
}

public toJSON() {
  return {
    results: this.results,
    total: this.total,
    page: this.page,
    pageSize: this.pageSize,
    totalPages: this.totalPages,
    hasNextPage: this.hasNextPage,
    hasPreviousPage: this.hasPreviousPage,
    query: this.query
  };
}
}