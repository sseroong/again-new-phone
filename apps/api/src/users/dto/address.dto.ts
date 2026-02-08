import { IsString, IsBoolean, IsOptional, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAddressDto {
  @ApiProperty({ example: "집", description: "배송지 이름" })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: "010-1234-5678", description: "연락처" })
  @IsString()
  phone: string;

  @ApiProperty({ example: "12345", description: "우편번호" })
  @IsString()
  zipCode: string;

  @ApiProperty({
    example: "서울시 강남구 테헤란로 123",
    description: "기본 주소",
  })
  @IsString()
  address: string;

  @ApiProperty({ example: "101동 1001호", description: "상세 주소" })
  @IsString()
  addressDetail: string;

  @ApiPropertyOptional({ example: true, description: "기본 배송지 여부" })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: "회사", description: "배송지 이름" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: "010-1234-5678", description: "연락처" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "12345", description: "우편번호" })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    example: "서울시 강남구 테헤란로 123",
    description: "기본 주소",
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: "101동 1001호", description: "상세 주소" })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({ example: true, description: "기본 배송지 여부" })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
