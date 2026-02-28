import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Brand, DeviceCategory } from "@prisma/client";

// ---------------------------------------------------------------------------
// Category DTOs
// ---------------------------------------------------------------------------

export class AdminCategoryQueryDto {
  @ApiPropertyOptional({ enum: DeviceCategory })
  @IsOptional()
  @IsEnum(DeviceCategory)
  type?: DeviceCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class AdminUpdateCategoryDto {
  @ApiPropertyOptional({ description: "카테고리 이름" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "설명" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "아이콘" })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: "정렬 순서" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: "활성 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// DeviceModel DTOs
// ---------------------------------------------------------------------------

export class AdminDeviceModelQueryDto {
  @ApiPropertyOptional({ description: "카테고리 ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: Brand })
  @IsOptional()
  @IsEnum(Brand)
  brand?: Brand;

  @ApiPropertyOptional({ description: "검색어 (모델명)" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

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

export class AdminCreateDeviceModelDto {
  @ApiProperty({ description: "카테고리 ID" })
  @IsString()
  categoryId: string;

  @ApiProperty({ enum: Brand, description: "브랜드" })
  @IsEnum(Brand)
  brand: Brand;

  @ApiProperty({ description: "모델명" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "시리즈" })
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ description: "출시일" })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;
}

export class AdminUpdateDeviceModelDto {
  @ApiPropertyOptional({ enum: Brand })
  @IsOptional()
  @IsEnum(Brand)
  brand?: Brand;

  @ApiPropertyOptional({ description: "모델명" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "시리즈" })
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ description: "출시일" })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({ description: "활성 여부" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// ModelVariant DTOs
// ---------------------------------------------------------------------------

export class AdminModelVariantQueryDto {
  @ApiPropertyOptional({ description: "기기모델 ID" })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ description: "저장 용량" })
  @IsOptional()
  @IsString()
  storage?: string;

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

export class AdminCreateModelVariantDto {
  @ApiProperty({ description: "기기모델 ID" })
  @IsString()
  modelId: string;

  @ApiProperty({ description: "저장 용량" })
  @IsString()
  storage: string;

  @ApiProperty({ description: "색상" })
  @IsString()
  color: string;

  @ApiPropertyOptional({ description: "출시가" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalMsrp?: number;
}

export class AdminUpdateModelVariantDto {
  @ApiPropertyOptional({ description: "저장 용량" })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiPropertyOptional({ description: "색상" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: "출시가" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalMsrp?: number;
}
