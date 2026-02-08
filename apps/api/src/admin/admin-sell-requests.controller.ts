import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentTenant } from "../tenant/tenant.decorator";
import { AdminSellRequestsService } from "./admin-sell-requests.service";
import {
  AdminSellRequestQueryDto,
  AdminUpdateSellRequestDto,
  AdminCreateQuoteDto,
} from "./dto";

@ApiTags("admin-sell-requests")
@Controller("admin/sell-requests")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminSellRequestsController {
  constructor(private readonly sellRequestsService: AdminSellRequestsService) {}

  @Get()
  @ApiOperation({ summary: "전체 판매접수 목록 (관리자)" })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: AdminSellRequestQueryDto,
  ) {
    return this.sellRequestsService.findAll(tenantId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "판매접수 상세 (관리자)" })
  findOne(@Param("id") id: string) {
    return this.sellRequestsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "판매접수 수정 (상태/등급/가격/검수메모)" })
  update(@Param("id") id: string, @Body() dto: AdminUpdateSellRequestDto) {
    return this.sellRequestsService.update(id, dto);
  }

  @Post(":id/quotes")
  @ApiOperation({ summary: "견적 생성" })
  createQuote(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() dto: AdminCreateQuoteDto,
  ) {
    return this.sellRequestsService.createQuote(tenantId, id, dto);
  }
}
