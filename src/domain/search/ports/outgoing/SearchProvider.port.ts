// src/domain/search/ports/outgoing/SearchProvider.port.ts

import type { SearchResult } from '../../entities/SearchResult';

export interface SearchHybridOptions {
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface ISearchProvider {
  hybridSearch(query: string, embedding: number[], options?: SearchHybridOptions): Promise<SearchResult[]>;
  createEmbedding(text: string): Promise<number[]>;
}
