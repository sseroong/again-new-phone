import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, OrderStatus, ProductStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderQueryDto, ConfirmPaymentDto } from './dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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
        tenantId: 'default-tenant',
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
          tenantId: 'default-tenant',
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

  async confirmPayment(dto: ConfirmPaymentDto) {
    const { paymentKey, orderId: orderNumber, amount } = dto;

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

    // 금액 검증
    if (order.totalAmount !== amount) {
      throw new BadRequestException('결제 금액이 일치하지 않습니다.');
    }

    // 토스페이먼츠 결제 승인 API 호출
    const tossSecretKey = this.configService.get<string>('TOSS_SECRET_KEY');
    const encodedKey = Buffer.from(`${tossSecretKey}:`).toString('base64');

    let tossResponse: any;
    try {
      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId: orderNumber, amount }),
      });

      tossResponse = await response.json();

      if (!response.ok) {
        this.logger.error(`토스 결제 승인 실패: ${JSON.stringify(tossResponse)}`);
        throw new BadRequestException(
          tossResponse.message || '결제 승인에 실패했습니다.',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`토스 API 호출 오류: ${error}`);
      throw new BadRequestException('결제 승인 중 오류가 발생했습니다.');
    }

    // 트랜잭션으로 결제 확정
    await this.prisma.executeInTransaction(async (tx) => {
      // 결제 정보 생성/업데이트
      const paymentData = {
        status: PaymentStatus.COMPLETED,
        transactionId: paymentKey,
        pgProvider: 'TOSS',
        pgResponse: tossResponse as any,
        paidAt: new Date(),
      };

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: paymentData,
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: (tossResponse.method === '카드' ? 'CARD' : 'BANK_TRANSFER') as any,
            tenantId: 'default-tenant',
            amount: order.totalAmount,
            ...paymentData,
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

    return { message: '결제가 완료되었습니다.', orderNumber };
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${dateStr}${random}`;
  }
}
