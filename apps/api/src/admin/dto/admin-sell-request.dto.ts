import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  SellRequestStatus,
  ProductGrade,
  DeviceCategory,
  Brand,
  TradeMethod,
} from "@prisma/client";

export class AdminSellRequestQueryDto {
  @ApiPropertyOptional({ enum: SellRequestStatus })
  @IsOptional()
  @IsEnum(SellRequestStatus)
  status?: SellRequestStatus;

  @ApiPropertyOptional({ description: "검색어 (모델명, 사용자)" })
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
  @ApiProperty({ description: "견적 금액" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: "견적 메모" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdminCreateSellRequestDto {
  @ApiProperty({ description: "사용자 ID" })
  @IsString()
  userId: string;

  @ApiProperty({ enum: DeviceCategory })
  @IsEnum(DeviceCategory)
  category: DeviceCategory;

  @ApiProperty({ enum: Brand })
  @IsEnum(Brand)
  brand: Brand;

  @ApiProperty({ description: "모델명" })
  @IsString()
  modelName: string;

  @ApiProperty({ description: "용량" })
  @IsString()
  storage: string;

  @ApiPropertyOptional({ description: "색상" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ enum: ProductGrade, description: "자체 평가 등급" })
  @IsEnum(ProductGrade)
  selfGrade: ProductGrade;

  @ApiProperty({ description: "예상 가격" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedPrice: number;

  @ApiProperty({ enum: TradeMethod, description: "거래 방식" })
  @IsEnum(TradeMethod)
  tradeMethod: TradeMethod;

  @ApiPropertyOptional({ description: "기기 상태 정보 (JSON)" })
  @IsOptional()
  deviceCondition?: any;

  @ApiPropertyOptional({ description: "검수 메모" })
  @IsOptional()
  @IsString()
  inspectionNotes?: string;
}
