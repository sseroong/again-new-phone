import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContentType, ContentStatus, BannerPosition } from '@prisma/client';

// ---------------------------------------------------------------------------
// Content DTOs
// ---------------------------------------------------------------------------

export class AdminCmsContentQueryDto {
  @ApiPropertyOptional({ enum: ContentType })
  @IsOptional()
  @IsEnum(ContentType)
  type?: ContentType;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
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

export class AdminCreateContentDto {
  @ApiProperty({ enum: ContentType, description: '콘텐츠 유형' })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ description: '제목' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '본문 (NOTICE, EVENT, GUIDE)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'FAQ 답변' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '이벤트 썸네일 URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: '시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '고정 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ enum: ContentStatus, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class AdminUpdateContentDto {
  @ApiPropertyOptional({ description: '제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '본문' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'FAQ 답변' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '이벤트 썸네일 URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: '시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '고정 여부' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

// ---------------------------------------------------------------------------
// Banner DTOs
// ---------------------------------------------------------------------------

export class AdminCmsBannerQueryDto {
  @ApiPropertyOptional({ enum: BannerPosition })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

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

export class AdminCreateBannerDto {
  @ApiProperty({ description: '배너 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '배너 이미지 URL' })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ description: '링크 URL' })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ enum: BannerPosition, default: 'MAIN_TOP' })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AdminUpdateBannerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ enum: BannerPosition })
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
