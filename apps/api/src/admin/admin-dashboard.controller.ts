import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardQueryDto } from './dto';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({ summary: '대시보드 통계 조회' })
  getStats(@CurrentTenant() tenantId: string, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getStats(tenantId, query);
  }
}
