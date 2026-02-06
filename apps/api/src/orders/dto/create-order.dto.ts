import { IsString, IsArray, ValidateNested, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class OrderItemDto {
  @ApiProperty({ description: '상품 ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: '수량', default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: '주문 상품 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: '수령인 이름' })
  @IsString()
  shippingName: string;

  @ApiProperty({ description: '수령인 연락처' })
  @IsString()
  shippingPhone: string;

  @ApiProperty({ description: '우편번호' })
  @IsString()
  shippingZipCode: string;

  @ApiProperty({ description: '배송 주소' })
  @IsString()
  shippingAddress: string;

  @ApiProperty({ description: '상세 주소' })
  @IsString()
  shippingDetail: string;

  @ApiPropertyOptional({ description: '배송 메모' })
  @IsOptional()
  @IsString()
  shippingMemo?: string;
}
