import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";
import { CurrentTenant } from "../tenant/tenant.decorator";
import { CmsService } from "./cms.service";
import { CmsContentQueryDto, CmsBannerQueryDto } from "./dto";

@ApiTags("cms")
@Controller("cms")
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get("contents")
  @ApiOperation({ summary: "게시된 콘텐츠 목록 조회" })
  findAllContents(
    @CurrentTenant() tenantId: string,
    @Query() query: CmsContentQueryDto,
  ) {
    return this.cmsService.findAllContents(tenantId, query);
  }

  @Public()
  @Get("contents/:id")
  @ApiOperation({ summary: "콘텐츠 상세 조회" })
  findOneContent(@Param("id") id: string) {
    return this.cmsService.findOneContent(id);
  }

  @Public()
  @Get("faqs")
  @ApiOperation({ summary: "FAQ 목록 조회" })
  findFaqs(
    @CurrentTenant() tenantId: string,
    @Query("category") category?: string,
  ) {
    return this.cmsService.findFaqs(tenantId, category);
  }

  @Public()
  @Get("banners")
  @ApiOperation({ summary: "활성 배너 목록 조회" })
  findBanners(
    @CurrentTenant() tenantId: string,
    @Query() query: CmsBannerQueryDto,
  ) {
    return this.cmsService.findBanners(tenantId, query);
  }
}
