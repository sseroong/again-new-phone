import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminOrderQueryDto,
  AdminUpdateOrderStatusDto,
  AdminUpdateTrackingDto,
  AdminShippingQueryDto,
} from "./dto";

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPING],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

@Injectable()
export class AdminOrdersService {
  constructor(private prisma: PrismaService) {}

  async findShippingList(tenantId: string, query: AdminShippingQueryDto) {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      tenantId,
      // 배송 관련 상태만 (결제 완료 이후)
      status: status || {
        in: [
          OrderStatus.PAID,
          OrderStatus.PREPARING,
          OrderStatus.SHIPPING,
          OrderStatus.DELIVERED,
          OrderStatus.COMPLETED,
        ],
      },
    };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { shippingName: { contains: search, mode: "insensitive" } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as any).gte = new Date(startDate);
      if (endDate)
        (where.createdAt as any).lte = new Date(endDate + "T23:59:59.999Z");
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          shippingName: true,
          shippingPhone: true,
          shippingZipCode: true,
          shippingAddress: true,
          shippingDetail: true,
          shippingMemo: true,
          trackingNumber: true,
          trackingCompany: true,
          shippedAt: true,
          deliveredAt: true,
          createdAt: true,
          items: {
            include: {
              product: { include: { model: true, variant: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findShippingDetail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippingName: true,
        shippingPhone: true,
        shippingZipCode: true,
        shippingAddress: true,
        shippingDetail: true,
        shippingMemo: true,
        trackingNumber: true,
        trackingCompany: true,
        shippedAt: true,
        deliveredAt: true,
        completedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { include: { category: true, model: true, variant: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException("주문을 찾을 수 없습니다.");
    return order;
  }

  async findAll(tenantId: string, query: AdminOrderQueryDto) {
    const { status, userId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { tenantId };

    if (status) where.status = status;
    if (userId) where.userId = userId;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { shippingName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: {
                include: { model: true, variant: true },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: {
              include: { category: true, model: true, variant: true },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException("주문을 찾을 수 없습니다.");
    }

    return order;
  }

  async updateStatus(id: string, dto: AdminUpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException("주문을 찾을 수 없습니다.");
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `${order.status} 상태에서 ${dto.status}(으)로 변경할 수 없습니다.`,
      );
    }

    const updateData: Prisma.OrderUpdateInput = { status: dto.status };

    if (dto.status === OrderStatus.SHIPPING) {
      updateData.shippedAt = new Date();
    } else if (dto.status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (dto.status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { include: { model: true, variant: true } },
          },
        },
        payment: true,
      },
    });
  }

  async updateTracking(id: string, dto: AdminUpdateTrackingDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException("주문을 찾을 수 없습니다.");
    }

    if (
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.SHIPPING
    ) {
      throw new BadRequestException("송장번호를 등록할 수 없는 상태입니다.");
    }

    const updateData: Prisma.OrderUpdateInput = {
      trackingNumber: dto.trackingNumber,
      trackingCompany: dto.trackingCompany,
    };

    // 준비중 상태에서 송장 등록 시 배송중으로 자동 변경
    if (order.status === OrderStatus.PREPARING) {
      updateData.status = OrderStatus.SHIPPING;
      updateData.shippedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }
}
