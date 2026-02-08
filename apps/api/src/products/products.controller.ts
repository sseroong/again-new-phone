import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { ProductQueryDto } from "./dto";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentTenant } from "../tenant/tenant.decorator";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "상품 목록 조회" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  @Public()
  @Get("categories")
  @ApiOperation({ summary: "카테고리 목록 조회" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Public()
  @Get("models")
  @ApiOperation({ summary: "기기 모델 목록 조회" })
  @ApiQuery({ name: "category", required: false, description: "카테고리 타입" })
  @ApiQuery({ name: "brand", required: false, description: "브랜드" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getModels(
    @Query("category") category?: string,
    @Query("brand") brand?: string,
  ) {
    return this.productsService.getModels(category, brand);
  }

  @Public()
  @Get("models/:modelId/variants")
  @ApiOperation({ summary: "모델 변형 목록 조회 (용량, 색상)" })
  @ApiParam({ name: "modelId", description: "모델 ID" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getModelVariants(@Param("modelId") modelId: string) {
    return this.productsService.getModelVariants(modelId);
  }

  @Public()
  @Get("popular")
  @ApiOperation({ summary: "인기 상품 조회" })
  @ApiQuery({ name: "limit", required: false, description: "조회 개수" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getPopular(
    @CurrentTenant() tenantId: string,
    @Query("limit") limit?: number,
  ) {
    return this.productsService.getPopularProducts(tenantId, limit || 10);
  }

  @Public()
  @Get("new")
  @ApiOperation({ summary: "신규 상품 조회" })
  @ApiQuery({ name: "limit", required: false, description: "조회 개수" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getNew(
    @CurrentTenant() tenantId: string,
    @Query("limit") limit?: number,
  ) {
    return this.productsService.getNewArrivals(tenantId, limit || 10);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "상품 상세 조회" })
  @ApiParam({ name: "id", description: "상품 ID" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  @ApiResponse({ status: 404, description: "상품을 찾을 수 없음" })
  async findOne(@CurrentTenant() tenantId: string, @Param("id") id: string) {
    return this.productsService.findOne(tenantId, id);
  }

  @Public()
  @Get(":id/similar")
  @ApiOperation({ summary: "유사 상품 조회" })
  @ApiParam({ name: "id", description: "상품 ID" })
  @ApiQuery({ name: "limit", required: false, description: "조회 개수" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getSimilar(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Query("limit") limit?: number,
  ) {
    return this.productsService.getSimilarProducts(tenantId, id, limit || 4);
  }
}
