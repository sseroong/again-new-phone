import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { UserRole } from "@prisma/client";

export class SuperAdminUserQueryDto {
  @ApiPropertyOptional({ description: "검색어 (이름/이메일)" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: "역할 필터" })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: "테넌트 ID 필터" })
  @IsOptional()
  @IsString()
  tenantId?: string;

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

export class AssignUserTenantDto {
  @ApiProperty({ description: "할당할 테넌트 ID" })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
    description: "테넌트 내 역할",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
