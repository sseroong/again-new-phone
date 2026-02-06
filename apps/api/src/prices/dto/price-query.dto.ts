import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceCategory, Brand, ProductGrade } from '@prisma/client';

export class PriceQueryDto {
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

  @ApiPropertyOptional({ description: '저장공간' })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiPropertyOptional({ enum: ProductGrade, description: '등급' })
  @IsOptional()
  @IsEnum(ProductGrade)
  grade?: ProductGrade;
}
