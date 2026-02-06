import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SellRequestStatus } from '@prisma/client';

export class SellRequestQueryDto {
  @ApiPropertyOptional({ enum: SellRequestStatus, description: '상태' })
  @IsOptional()
  @IsEnum(SellRequestStatus)
  status?: SellRequestStatus;

  @ApiPropertyOptional({ description: '페이지', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
