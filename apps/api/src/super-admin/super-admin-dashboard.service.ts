import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminDashboardQueryDto } from './dto';

@Injectable()
export class SuperAdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(query: SuperAdminDashboardQueryDto) {
    const dateFilter = this.buildDateFilter(query);

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      totalRevenue,
      tenantStats,
    ] = await Promise.all([
      this.prisma.tenant.count(),

      this.prisma.tenant.count({ where: { isActive: true } }),

      this.prisma.user.count(),

      this.prisma.order.count({
        where: {
          ...dateFilter,
          status: { not: OrderStatus.CANCELLED },
        },
      }),

      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.COMPLETED,
          ...(dateFilter.createdAt ? { paidAt: dateFilter.createdAt } : {}),
        },
      }),

      this.prisma.tenant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      stats: {
        totalTenants,
        activeTenants,
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      tenantStats,
    };
  }

  private buildDateFilter(query: SuperAdminDashboardQueryDto) {
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
