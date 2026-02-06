import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, OrderStatus, ProductStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderQueryDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // 상품 조회 및 검증
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('일부 상품을 찾을 수 없습니다.');
    }

    // 상품 상태 확인
    const unavailableProducts = products.filter(
      (p) => p.status !== ProductStatus.AVAILABLE,
    );

    if (unavailableProducts.length > 0) {
      throw new BadRequestException('일부 상품이 판매 불가 상태입니다.');
    }

    // 총 금액 계산
    let totalAmount = 0;
    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemTotal = product.sellingPrice * item.quantity;
      totalAmount += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.sellingPrice,
      };
    });

    // 주문번호 생성
    const orderNumber = this.generateOrderNumber();

    // 트랜잭션으로 주문 생성
    const order = await this.prisma.executeInTransaction(async (tx) => {
      // 상품 상태 변경 (예약)
      await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: ProductStatus.RESERVED },
      });

      // 주문 생성
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          shippingName: dto.shippingName,
          shippingPhone: dto.shippingPhone,
          shippingZipCode: dto.shippingZipCode,
          shippingAddress: dto.shippingAddress,
          shippingDetail: dto.shippingDetail,
          shippingMemo: dto.shippingMemo,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  model: true,
                  variant: true,
                },
              },
            },
          },
        },
      });

      return newOrder;
    });

    return order;
  }

  async findAll(userId: string, query: OrderQueryDto) {
    const { status, page = 1, limit = 10 } = query;

    const where: Prisma.OrderWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  model: true,
                  variant: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
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

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                model: true,
                variant: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                model: true,
                variant: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async cancel(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true, payment: true },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    // 결제 완료 후에는 취소 불가
    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.payment?.status === PaymentStatus.COMPLETED
    ) {
      throw new BadRequestException('결제 완료된 주문은 취소할 수 없습니다. 고객센터에 문의해주세요.');
    }

    // 트랜잭션으로 취소 처리
    await this.prisma.executeInTransaction(async (tx) => {
      // 상품 상태 복원
      const productIds = order.items.map((item) => item.productId);
      await tx.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: ProductStatus.AVAILABLE },
      });

      // 주문 상태 변경
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    return { message: '주문이 취소되었습니다.' };
  }

  async confirmPayment(orderNumber: string, paymentData: any) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('결제 대기 상태가 아닙니다.');
    }

    // 트랜잭션으로 결제 확정
    await this.prisma.executeInTransaction(async (tx) => {
      // 결제 정보 생성/업데이트
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: paymentData.paymentKey,
            pgProvider: 'TOSS',
            pgResponse: paymentData,
            paidAt: new Date(),
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: paymentData.method || 'CARD',
            status: PaymentStatus.COMPLETED,
            amount: order.totalAmount,
            transactionId: paymentData.paymentKey,
            pgProvider: 'TOSS',
            pgResponse: paymentData,
            paidAt: new Date(),
          },
        });
      }

      // 주문 상태 변경
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 상품 상태 변경 (판매 완료)
      const productIds = await tx.orderItem.findMany({
        where: { orderId: order.id },
        select: { productId: true },
      });

      await tx.product.updateMany({
        where: { id: { in: productIds.map((p) => p.productId) } },
        data: { status: ProductStatus.SOLD },
      });
    });

    return { message: '결제가 완료되었습니다.' };
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${dateStr}${random}`;
  }
}
