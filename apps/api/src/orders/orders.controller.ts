import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderQueryDto, ConfirmPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../tenant/tenant.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({ status: 201, description: '주문 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 주문 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Query() query: OrderQueryDto,
  ) {
    return this.ordersService.findAll(tenantId, userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '주문 상세 조회' })
  @ApiParam({ name: 'id', description: '주문 ID' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '주문을 찾을 수 없음' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '주문 취소' })
  @ApiParam({ name: 'id', description: '주문 ID' })
  @ApiResponse({ status: 200, description: '취소 성공' })
  @ApiResponse({ status: 400, description: '취소 불가' })
  @ApiResponse({ status: 404, description: '주문을 찾을 수 없음' })
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.cancel(userId, id);
  }

  // 결제 확인 (토스페이먼츠 콜백)
  @Public()
  @Post('confirm')
  @ApiOperation({ summary: '결제 확인 (토스페이먼츠)' })
  @ApiResponse({ status: 200, description: '결제 확인 성공' })
  @ApiResponse({ status: 400, description: '결제 승인 실패' })
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.ordersService.confirmPayment(dto);
  }
}
