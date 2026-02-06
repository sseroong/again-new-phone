import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeviceCategory, Brand, ProductGrade, ProductStatus } from '@prisma/client';

export class ProductQueryDto {
  @ApiPropertyOptional({ enum: DeviceCategory, description: '카테고리' })
  @IsOptional()
  @IsEnum(DeviceCategory)
  category?: DeviceCategory;

  @ApiPropertyOptional({ enum: Brand, description: '브랜드' })
  @IsOptional()
  @IsEnum(Brand)
  brand?: Brand;

  @ApiPropertyOptional({ description: '모델 ID' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ enum: ProductGrade, description: '등급' })
  @IsOptional()
  @IsEnum(ProductGrade)
  grade?: ProductGrade;

  @ApiPropertyOptional({ enum: ProductStatus, description: '상태' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: '저장공간 (예: 256GB)' })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiPropertyOptional({ description: '최소 가격' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: '최대 가격' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100000000)
  maxPrice?: number;

  @ApiPropertyOptional({ description: '검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '정렬 기준', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: '정렬 방향', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: '페이지', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
