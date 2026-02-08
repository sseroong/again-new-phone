import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReviewType } from "@prisma/client";

export class CreateReviewDto {
  @ApiProperty({
    enum: ReviewType,
    description: "리뷰 유형 (SELL: 판매, BUY: 구매)",
  })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiPropertyOptional({ description: "주문 ID (구매 리뷰인 경우)" })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: "판매 접수 ID (판매 리뷰인 경우)" })
  @IsOptional()
  @IsString()
  sellRequestId?: string;

  @ApiProperty({ description: "상품 모델명" })
  @IsString()
  productModel: string;

  @ApiProperty({ description: "리뷰 제목" })
  @IsString()
  title: string;

  @ApiProperty({ description: "리뷰 내용" })
  @IsString()
  content: string;

  @ApiProperty({ description: "평점 (1-5)", default: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: "이미지 URL 배열" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: "받은 견적 수 (판매 리뷰인 경우)" })
  @IsOptional()
  @IsInt()
  @Min(0)
  quotesReceived?: number;
}
