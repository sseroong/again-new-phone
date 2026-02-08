import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { TenantService } from "./tenant.service";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("tenants")
@Controller("tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get("resolve")
  @Public()
  @ApiOperation({ summary: "테넌트 조회 (도메인 또는 slug)" })
  @ApiQuery({ name: "domain", required: false })
  @ApiQuery({ name: "slug", required: false })
  @ApiResponse({ status: 200, description: "테넌트 정보 반환" })
  async resolve(
    @Query("domain") domain?: string,
    @Query("slug") slug?: string,
  ) {
    const tenant = await this.tenantService.resolve(domain, slug);
    if (!tenant) return null;
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      settings: tenant.settings,
    };
  }
}
