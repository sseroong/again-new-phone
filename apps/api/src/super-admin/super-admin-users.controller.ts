import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuperAdminUsersService } from './super-admin-users.service';
import { SuperAdminUserQueryDto, AssignUserTenantDto } from './dto';

@ApiTags('super-admin-users')
@Controller('super-admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class SuperAdminUsersController {
  constructor(private readonly usersService: SuperAdminUsersService) {}

  @Get()
  @ApiOperation({ summary: '전체 사용자 목록 조회 (테넌트 정보 포함)' })
  findAll(@Query() query: SuperAdminUserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: '사용자-테넌트 할당' })
  assignTenant(@Param('id') id: string, @Body() dto: AssignUserTenantDto) {
    return this.usersService.assignTenant(id, dto);
  }

  @Delete(':id/tenants/:tenantId')
  @ApiOperation({ summary: '사용자-테넌트 해제' })
  removeTenant(
    @Param('id') id: string,
    @Param('tenantId') tenantId: string,
  ) {
    return this.usersService.removeTenant(id, tenantId);
  }
}
