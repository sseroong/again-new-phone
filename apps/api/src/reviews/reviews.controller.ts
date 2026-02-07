import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '리뷰 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.findAll(tenantId, query);
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: '리뷰 통계' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getStats(@CurrentTenant() tenantId: string) {
    return this.reviewsService.getStats(tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 리뷰 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findMyReviews(
    @CurrentUser('id') userId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.findMyReviews(userId, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '리뷰 상세 조회' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '리뷰를 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 작성' })
  @ApiResponse({ status: 201, description: '작성 성공' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(tenantId, userId, dto);
  }

  @Public()
  @Post(':id/like')
  @ApiOperation({ summary: '리뷰 좋아요' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '좋아요 성공' })
  async like(@Param('id') id: string) {
    return this.reviewsService.like(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 삭제' })
  @ApiParam({ name: 'id', description: '리뷰 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.reviewsService.delete(userId, id);
  }
}
