import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export class TenantQueryDto {
  @ApiPropertyOptional({ description: "검색어 (이름/slug)" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "활성 상태 필터" })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
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

export class CreateTenantDto {
  @ApiProperty({ description: "테넌트 이름" })
  @IsString()
  name: string;

  @ApiProperty({ description: "테넌트 슬러그 (URL용, 소문자+숫자+하이픈)" })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: "slug는 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  })
  slug: string;

  @ApiPropertyOptional({ description: "테넌트 도메인" })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: "테넌트 설정 (JSON)" })
  @IsOptional()
  settings?: any;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: "테넌트 이름" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "테넌트 슬러그" })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: "slug는 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  })
  slug?: string;

  @ApiPropertyOptional({ description: "테넌트 도메인" })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ description: "테넌트 설정 (JSON)" })
  @IsOptional()
  settings?: any;

  @ApiPropertyOptional({ description: "활성 상태" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
