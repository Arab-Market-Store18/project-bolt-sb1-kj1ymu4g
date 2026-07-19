// src/domain/search/value-objects/Pagination.ts

// src/domain/search/value-objects/Pagination.ts

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export class Pagination {
  public readonly page: number;
  public readonly limit: number;
  public readonly offset: number;

  private constructor(props: { page: number; limit: number }) {
    this.page = props.page;
    this.limit = props.limit;
    this.offset = (props.page - 1) * props.limit;
  }

  public static create(props?: { page?: number; limit?: number }): Pagination {
    const page = props?.page && props.page > 0 ? props.page : DEFAULT_PAGE;
    const limit = props?.limit && props.limit > 0 ? props.limit : DEFAULT_LIMIT;

    return new Pagination({ page, limit });
  }
}
