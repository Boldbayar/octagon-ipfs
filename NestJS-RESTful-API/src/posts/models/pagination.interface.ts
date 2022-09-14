import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Pagination {
  currentPage: number;
  pageSize: number;
  total: number;
  sortDirection: String;
  sortParam: String;
  current: number;
}
