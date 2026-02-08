import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AdminProductsService } from "./admin-products.service";
import {
  AdminProductQueryDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
} from "./dto";

@ApiTags("admin-products")
@Controller("admin/products")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: "전체 상품 목록 (관리자)" })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: AdminProductQueryDto,
  ) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "상품 상세 (관리자)" })
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "상품 등록" })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: AdminCreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "상품 수정" })
  update(@Param("id") id: string, @Body() dto: AdminUpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "상품 비활성화" })
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
