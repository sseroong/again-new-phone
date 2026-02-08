import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  DeviceCategory,
  Brand,
  ProductGrade,
  TradeMethod,
} from "@prisma/client";

export class DeviceConditionDto {
  @ApiProperty({ description: "전원 켜짐 여부" })
  powerOn: boolean;

  @ApiProperty({ description: "화면 상태" })
  screenCondition: string;

  @ApiProperty({ description: "외관 상태" })
  bodyCondition: string;

  @ApiProperty({ description: "버튼 작동 여부" })
  buttonsWorking: boolean;

  @ApiPropertyOptional({ description: "배터리 효율 (%)" })
  batteryHealth?: number;

  @ApiPropertyOptional({ description: "기타 특이사항" })
  notes?: string;
}

export class CreateSellRequestDto {
  @ApiProperty({ enum: DeviceCategory, description: "기기 카테고리" })
  @IsEnum(DeviceCategory)
  category: DeviceCategory;

  @ApiProperty({ enum: Brand, description: "브랜드" })
  @IsEnum(Brand)
  brand: Brand;

  @ApiProperty({ description: "모델명 (예: 아이폰 15 Pro)" })
  @IsString()
  modelName: string;

  @ApiProperty({ description: "저장공간 (예: 256GB)" })
  @IsString()
  storage: string;

  @ApiPropertyOptional({ description: "색상" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ enum: ProductGrade, description: "자가 진단 등급" })
  @IsEnum(ProductGrade)
  selfGrade: ProductGrade;

  @ApiProperty({ description: "예상 판매 가격" })
  @IsInt()
  @Min(0)
  estimatedPrice: number;

  @ApiProperty({ enum: TradeMethod, description: "거래 방식" })
  @IsEnum(TradeMethod)
  tradeMethod: TradeMethod;

  @ApiProperty({ type: DeviceConditionDto, description: "기기 상태 정보" })
  @IsObject()
  deviceCondition: DeviceConditionDto;
}
