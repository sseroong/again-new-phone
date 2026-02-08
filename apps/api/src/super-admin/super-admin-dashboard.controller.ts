import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { SuperAdminDashboardService } from "./super-admin-dashboard.service";
import { SuperAdminDashboardQueryDto } from "./dto";

@ApiTags("super-admin-dashboard")
@Controller("super-admin/dashboard")
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class SuperAdminDashboardController {
  constructor(private readonly dashboardService: SuperAdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: "슈퍼어드민 글로벌 대시보드 통계" })
  getStats(@Query() query: SuperAdminDashboardQueryDto) {
    return this.dashboardService.getStats(query);
  }
}
