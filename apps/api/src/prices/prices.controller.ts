import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductGrade } from '@prisma/client';
import { PricesService } from './prices.service';
import { PriceQueryDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('prices')
@Controller('prices')
@Public()
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  @ApiOperation({ summary: '시세 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getPriceGuides(@Query() query: PriceQueryDto) {
    return this.pricesService.getPriceGuides(query);
  }

  @Get('today')
  @ApiOperation({ summary: '오늘의 시세' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getTodayPrices(@Query('category') category?: string) {
    return this.pricesService.getTodayPrices(category);
  }

  @Get('popular')
  @ApiOperation({ summary: '인기 모델 시세' })
  @ApiQuery({ name: 'limit', required: false, description: '조회 개수' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getPopularModels(@Query('limit') limit?: number) {
    return this.pricesService.getPopularModels(limit || 10);
  }

  @Get('search')
  @ApiOperation({ summary: '시세 검색' })
  @ApiQuery({ name: 'keyword', description: '검색어' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async searchPrices(@Query('keyword') keyword: string) {
    return this.pricesService.searchPrices(keyword);
  }

  @Get('models/:modelId')
  @ApiOperation({ summary: '모델별 시세 상세' })
  @ApiParam({ name: 'modelId', description: '모델 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '모델을 찾을 수 없음' })
  async getModelPrices(@Param('modelId') modelId: string) {
    return this.pricesService.getModelPrices(modelId);
  }

  @Get('history/:modelId')
  @ApiOperation({ summary: '시세 변동 히스토리' })
  @ApiParam({ name: 'modelId', description: '모델 ID' })
  @ApiQuery({ name: 'storage', description: '저장공간' })
  @ApiQuery({ name: 'grade', enum: ProductGrade, description: '등급' })
  @ApiQuery({ name: 'days', required: false, description: '조회 기간 (일)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getPriceHistory(
    @Param('modelId') modelId: string,
    @Query('storage') storage: string,
    @Query('grade') grade: ProductGrade,
    @Query('days') days?: number,
  ) {
    return this.pricesService.getPriceHistory(modelId, storage, grade, days || 30);
  }
}
