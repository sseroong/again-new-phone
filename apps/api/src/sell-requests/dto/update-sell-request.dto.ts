import { IsString, IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ProductGrade, SellRequestStatus, TradeMethod } from "@prisma/client";

export class UpdateSellRequestDto {
  @ApiPropertyOptional({ enum: TradeMethod, description: "거래 방식" })
  @IsOptional()
  @IsEnum(TradeMethod)
  tradeMethod?: TradeMethod;

  @ApiPropertyOptional({ description: "송장번호" })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

// 관리자용 DTO
export class AdminUpdateSellRequestDto {
  @ApiPropertyOptional({ enum: SellRequestStatus, description: "상태" })
  @IsOptional()
  @IsEnum(SellRequestStatus)
  status?: SellRequestStatus;

  @ApiPropertyOptional({ enum: ProductGrade, description: "최종 등급" })
  @IsOptional()
  @IsEnum(ProductGrade)
  finalGrade?: ProductGrade;

  @ApiPropertyOptional({ description: "최종 가격" })
  @IsOptional()
  @IsInt()
  @Min(0)
  finalPrice?: number;

  @ApiPropertyOptional({ description: "검수 메모" })
  @IsOptional()
  @IsString()
  inspectionNotes?: string;
}
