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
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AdminCmsService } from "./admin-cms.service";
import {
  AdminCmsContentQueryDto,
  AdminCreateContentDto,
  AdminUpdateContentDto,
  AdminCmsBannerQueryDto,
  AdminCreateBannerDto,
  AdminUpdateBannerDto,
} from "./dto";

@ApiTags("admin-cms")
@Controller("admin/cms")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminCmsController {
  constructor(private readonly cmsService: AdminCmsService) {}

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------

  @Get("contents")
  @ApiOperation({ summary: "콘텐츠 목록 (관리자)" })
  findAllContents(
    @CurrentTenant() tenantId: string,
    @Query() query: AdminCmsContentQueryDto,
  ) {
    return this.cmsService.findAllContents(tenantId, query);
  }

  @Get("contents/:id")
  @ApiOperation({ summary: "콘텐츠 상세 (관리자)" })
  findOneContent(@Param("id") id: string) {
    return this.cmsService.findOneContent(id);
  }

  @Post("contents")
  @ApiOperation({ summary: "콘텐츠 등록" })
  createContent(
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") authorId: string,
    @Body() dto: AdminCreateContentDto,
  ) {
    return this.cmsService.createContent(tenantId, authorId, dto);
  }

  @Patch("contents/:id")
  @ApiOperation({ summary: "콘텐츠 수정" })
  updateContent(@Param("id") id: string, @Body() dto: AdminUpdateContentDto) {
    return this.cmsService.updateContent(id, dto);
  }

  @Delete("contents/:id")
  @ApiOperation({ summary: "콘텐츠 보관 처리" })
  removeContent(@Param("id") id: string) {
    return this.cmsService.removeContent(id);
  }

  // ---------------------------------------------------------------------------
  // Banner
  // ---------------------------------------------------------------------------

  @Get("banners")
  @ApiOperation({ summary: "배너 목록 (관리자)" })
  findAllBanners(
    @CurrentTenant() tenantId: string,
    @Query() query: AdminCmsBannerQueryDto,
  ) {
    return this.cmsService.findAllBanners(tenantId, query);
  }

  @Get("banners/:id")
  @ApiOperation({ summary: "배너 상세 (관리자)" })
  findOneBanner(@Param("id") id: string) {
    return this.cmsService.findOneBanner(id);
  }

  @Post("banners")
  @ApiOperation({ summary: "배너 등록" })
  createBanner(
    @CurrentTenant() tenantId: string,
    @Body() dto: AdminCreateBannerDto,
  ) {
    return this.cmsService.createBanner(tenantId, dto);
  }

  @Patch("banners/:id")
  @ApiOperation({ summary: "배너 수정" })
  updateBanner(@Param("id") id: string, @Body() dto: AdminUpdateBannerDto) {
    return this.cmsService.updateBanner(id, dto);
  }

  @Delete("banners/:id")
  @ApiOperation({ summary: "배너 비활성화" })
  removeBanner(@Param("id") id: string) {
    return this.cmsService.removeBanner(id);
  }
}
