import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SellRequestStatus, ProductGrade } from '@prisma/client';

export class AdminSellRequestQueryDto {
  @ApiPropertyOptional({ enum: SellRequestStatus })
  @IsOptional()
  @IsEnum(SellRequestStatus)
  status?: SellRequestStatus;

  @ApiPropertyOptional({ description: '검색어 (모델명, 사용자)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AdminUpdateSellRequestDto {
  @ApiPropertyOptional({ enum: SellRequestStatus })
  @IsOptional()
  @IsEnum(SellRequestStatus)
  status?: SellRequestStatus;

  @ApiPropertyOptional({ enum: ProductGrade })
  @IsOptional()
  @IsEnum(ProductGrade)
  finalGrade?: ProductGrade;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  finalPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspectionNotes?: string;
}

export class AdminCreateQuoteDto {
  @ApiProperty({ description: '견적 금액' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '견적 메모' })
  @IsOptional()
  @IsString()
  notes?: string;
}
