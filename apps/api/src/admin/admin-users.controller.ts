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
import { AdminUsersService } from './admin-users.service';
import { AdminUserQueryDto, AdminUpdateUserDto } from './dto';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: '전체 회원 목록 (관리자)' })
  findAll(@Query() query: AdminUserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '회원 상세 (관리자)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '회원 정보 수정 (역할, 활성상태)' })
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
