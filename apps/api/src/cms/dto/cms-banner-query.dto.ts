import { IsOptional, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BannerPosition } from "@prisma/client";

export class CmsBannerQueryDto {
  @ApiPropertyOptional({ enum: BannerPosition, description: "배너 위치" })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;
}
