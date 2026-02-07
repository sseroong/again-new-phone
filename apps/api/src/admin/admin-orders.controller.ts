import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { AdminOrdersService } from './admin-orders.service';
import {
  AdminOrderQueryDto,
  AdminUpdateOrderStatusDto,
  AdminUpdateTrackingDto,
} from './dto';

@ApiTags('admin-orders')
@Controller('admin/orders')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: '전체 주문 목록 (관리자)' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: AdminOrderQueryDto) {
    return this.ordersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '주문 상세 (관리자)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '주문 상태 변경' })
  updateStatus(@Param('id') id: string, @Body() dto: AdminUpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: '송장번호 등록' })
  updateTracking(@Param('id') id: string, @Body() dto: AdminUpdateTrackingDto) {
    return this.ordersService.updateTracking(id, dto);
  }
}
