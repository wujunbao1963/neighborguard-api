import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION } from '../constants';

/**
 * Base pagination query DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: PAGINATION.MIN_LIMIT,
    maximum: PAGINATION.MAX_LIMIT,
    default: PAGINATION.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_LIMIT)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (ISO datetime string)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * Pagination metadata response
 */
export class PaginationMetaDto {
  @ApiPropertyOptional()
  total?: number;

  @ApiPropertyOptional()
  limit: number;

  @ApiPropertyOptional()
  nextCursor?: string;

  @ApiPropertyOptional()
  hasMore: boolean;

  constructor(partial: Partial<PaginationMetaDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}
