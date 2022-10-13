import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Pagination } from './pagination.interface';

export class ApiModel {
  pagination: Pagination;

  @ApiProperty({ type: String })
  list: Array<Object>;
}
