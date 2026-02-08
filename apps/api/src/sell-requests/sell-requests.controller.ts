import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { SellRequestsService } from "./sell-requests.service";
import {
  CreateSellRequestDto,
  SellRequestQueryDto,
  UpdateSellRequestDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CurrentTenant } from "../tenant/tenant.decorator";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("sell-requests")
@Controller("sell-requests")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellRequestsController {
  constructor(private readonly sellRequestsService: SellRequestsService) {}

  @Post()
  @ApiOperation({ summary: "판매 접수 생성" })
  @ApiResponse({ status: 201, description: "접수 성공" })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateSellRequestDto,
  ) {
    return this.sellRequestsService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "내 판매 접수 목록 조회" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
    @Query() query: SellRequestQueryDto,
  ) {
    return this.sellRequestsService.findAll(tenantId, userId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "판매 접수 상세 조회" })
  @ApiParam({ name: "id", description: "판매 접수 ID" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  @ApiResponse({ status: 404, description: "판매 접수를 찾을 수 없음" })
  async findOne(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.sellRequestsService.findOne(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "판매 접수 수정" })
  @ApiParam({ name: "id", description: "판매 접수 ID" })
  @ApiResponse({ status: 200, description: "수정 성공" })
  async update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateSellRequestDto,
  ) {
    return this.sellRequestsService.update(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "판매 접수 취소" })
  @ApiParam({ name: "id", description: "판매 접수 ID" })
  @ApiResponse({ status: 200, description: "취소 성공" })
  async cancel(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.sellRequestsService.cancel(userId, id);
  }

  @Post(":id/quotes/:quoteId/accept")
  @ApiOperation({ summary: "견적 수락" })
  @ApiParam({ name: "id", description: "판매 접수 ID" })
  @ApiParam({ name: "quoteId", description: "견적 ID" })
  @ApiResponse({ status: 200, description: "수락 성공" })
  async acceptQuote(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Param("quoteId") quoteId: string,
  ) {
    return this.sellRequestsService.acceptQuote(userId, id, quoteId);
  }

  @Post(":id/tracking")
  @ApiOperation({ summary: "송장번호 등록" })
  @ApiParam({ name: "id", description: "판매 접수 ID" })
  @ApiResponse({ status: 200, description: "등록 성공" })
  async addTrackingNumber(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body("trackingNumber") trackingNumber: string,
  ) {
    return this.sellRequestsService.addTrackingNumber(
      userId,
      id,
      trackingNumber,
    );
  }

  @Public()
  @Get("estimate/price")
  @ApiOperation({ summary: "예상 시세 조회" })
  @ApiQuery({ name: "category", description: "카테고리" })
  @ApiQuery({ name: "brand", description: "브랜드" })
  @ApiQuery({ name: "modelName", description: "모델명" })
  @ApiQuery({ name: "storage", description: "저장공간" })
  @ApiQuery({ name: "grade", description: "등급" })
  @ApiResponse({ status: 200, description: "조회 성공" })
  async getEstimatedPrice(
    @Query("category") category: string,
    @Query("brand") brand: string,
    @Query("modelName") modelName: string,
    @Query("storage") storage: string,
    @Query("grade") grade: string,
  ) {
    return this.sellRequestsService.getEstimatedPrice(
      category,
      brand,
      modelName,
      storage,
      grade,
    );
  }
}
