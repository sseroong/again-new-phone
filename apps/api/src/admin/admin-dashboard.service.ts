import { Injectable } from '@nestjs/common';
import { OrderStatus, SellRequestStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardQueryDto } from './dto';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string, query: DashboardQueryDto) {
    const dateFilter = this.buildDateFilter(query);

    const [
      totalOrders,
      totalRevenue,
      activeUsers,
      pendingSellRequests,
      recentOrders,
      recentSellRequests,
    ] = await Promise.all([
      // 총 주문 수
      this.prisma.order.count({
        where: {
          tenantId,
          ...dateFilter,
          status: { not: OrderStatus.CANCELLED },
        },
      }),

      // 총 매출 (결제 완료된 금액)
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          tenantId,
          status: PaymentStatus.COMPLETED,
          ...(dateFilter.createdAt ? { paidAt: dateFilter.createdAt } : {}),
        },
      }),

      // 활성 회원 수
      this.prisma.user.count({
        where: { isActive: true },
      }),

      // 대기 중인 판매접수 수
      this.prisma.sellRequest.count({
        where: { tenantId, status: SellRequestStatus.PENDING },
      }),

      // 최근 주문 5건
      this.prisma.order.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: {
                include: { model: true, variant: true },
              },
            },
          },
        },
      }),

      // 최근 판매접수 5건
      this.prisma.sellRequest.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeUsers,
        pendingSellRequests,
      },
      recentOrders,
      recentSellRequests,
    };
  }

  private buildDateFilter(query: DashboardQueryDto) {
    const filter: any = {};

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
      }
    }

    return filter;
  }
}
