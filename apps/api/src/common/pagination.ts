import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  get skip() {
    return (this.page - 1) * this.limit;
  }
}

/** Standard paginated response: { items, total, page, limit }. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function paginated<T>(items: T[], total: number, q: PaginationQuery): Paginated<T> {
  return { items, total, page: q.page, limit: q.limit };
}
