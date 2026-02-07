import {
  Controller,
  Get,
  Post,
  Patch,
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
import { SuperAdminTenantsService } from './super-admin-tenants.service';
import { TenantQueryDto, CreateTenantDto, UpdateTenantDto } from './dto';

@ApiTags('super-admin-tenants')
@Controller('super-admin/tenants')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class SuperAdminTenantsController {
  constructor(private readonly tenantsService: SuperAdminTenantsService) {}

  @Get()
  @ApiOperation({ summary: '테넌트 목록 조회' })
  findAll(@Query() query: TenantQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: '테넌트 생성' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '테넌트 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '테넌트 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '테넌트 비활성화 (소프트 삭제)' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
