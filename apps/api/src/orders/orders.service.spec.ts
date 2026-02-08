import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OrderStatus, ProductStatus, PaymentStatus } from "@prisma/client";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: MockPrismaService;
  let configService: { get: jest.Mock };

  const userId = "user-uuid-1";
  const tenantId = "default-tenant";

  const mockProduct1 = {
    id: "product-1",
    name: "아이폰 15 Pro",
    sellingPrice: 1200000,
    status: ProductStatus.AVAILABLE,
    model: { id: "model-1", name: "아이폰 15 Pro" },
    variant: { id: "variant-1", storage: "256GB" },
  };

  const mockProduct2 = {
    id: "product-2",
    name: "갤럭시 S24",
    sellingPrice: 800000,
    status: ProductStatus.AVAILABLE,
    model: { id: "model-2", name: "갤럭시 S24" },
    variant: { id: "variant-2", storage: "128GB" },
  };

  const createOrderDto = {
    items: [
      { productId: "product-1", quantity: 1 },
      { productId: "product-2", quantity: 1 },
    ],
    shippingName: "홍길동",
    shippingPhone: "010-1234-5678",
    shippingZipCode: "06100",
    shippingAddress: "서울시 강남구 역삼동",
    shippingDetail: "101호",
    shippingMemo: "부재 시 경비실에 맡겨주세요",
  };

  const mockOrder = {
    id: "order-uuid-1",
    orderNumber: "ORD20240101ABC123",
    userId,
    totalAmount: 2000000,
    status: OrderStatus.PENDING_PAYMENT,
    shippingName: "홍길동",
    shippingPhone: "010-1234-5678",
    shippingZipCode: "06100",
    shippingAddress: "서울시 강남구 역삼동",
    shippingDetail: "101호",
    shippingMemo: "부재 시 경비실에 맡겨주세요",
    createdAt: new Date("2024-01-01"),
    items: [
      {
        id: "item-1",
        orderId: "order-uuid-1",
        productId: "product-1",
        quantity: 1,
        price: 1200000,
        product: mockProduct1,
      },
      {
        id: "item-2",
        orderId: "order-uuid-1",
        productId: "product-2",
        quantity: 1,
        price: 800000,
        product: mockProduct2,
      },
    ],
    payment: null,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe("create", () => {
    it("정상적으로 주문을 생성한다", async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct1, mockProduct2]);
      prisma.product.updateMany.mockResolvedValue({ count: 2 });
      prisma.order.create.mockResolvedValue(mockOrder);

      const result = await service.create(tenantId, userId, createOrderDto);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["product-1", "product-2"] } },
      });
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["product-1", "product-2"] } },
        data: { status: ProductStatus.RESERVED },
      });
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          totalAmount: 2000000,
          tenantId: "default-tenant",
          shippingName: "홍길동",
          shippingPhone: "010-1234-5678",
          shippingZipCode: "06100",
          shippingAddress: "서울시 강남구 역삼동",
          shippingDetail: "101호",
          shippingMemo: "부재 시 경비실에 맡겨주세요",
          items: {
            create: [
              {
                productId: "product-1",
                quantity: 1,
                price: 1200000,
                tenantId: "default-tenant",
              },
              {
                productId: "product-2",
                quantity: 1,
                price: 800000,
                tenantId: "default-tenant",
              },
            ],
          },
        }),
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
      expect(prisma.executeInTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockOrder);
    });

    it("주문 금액이 상품 가격 합계와 일치한다", async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct1]);
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.create.mockResolvedValue({
        ...mockOrder,
        totalAmount: 1200000,
      });

      const singleItemDto = {
        ...createOrderDto,
        items: [{ productId: "product-1", quantity: 1 }],
      };

      await service.create(tenantId, userId, singleItemDto);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1200000,
          }),
        }),
      );
    });

    it("수량이 2 이상인 경우 금액을 올바르게 계산한다", async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct1]);
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.create.mockResolvedValue({
        ...mockOrder,
        totalAmount: 2400000,
      });

      const multiQuantityDto = {
        ...createOrderDto,
        items: [{ productId: "product-1", quantity: 2 }],
      };

      await service.create(tenantId, userId, multiQuantityDto);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 2400000,
            items: {
              create: [
                {
                  productId: "product-1",
                  quantity: 2,
                  price: 1200000,
                  tenantId: "default-tenant",
                },
              ],
            },
          }),
        }),
      );
    });

    it("존재하지 않는 상품이 포함되면 BadRequestException을 던진다", async () => {
      // 2개 요청했지만 1개만 반환
      prisma.product.findMany.mockResolvedValue([mockProduct1]);

      await expect(
        service.create(tenantId, userId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, userId, createOrderDto),
      ).rejects.toThrow("일부 상품을 찾을 수 없습니다.");
      expect(prisma.executeInTransaction).not.toHaveBeenCalled();
    });

    it("판매 불가(품절) 상품이 포함되면 BadRequestException을 던진다", async () => {
      const soldProduct = { ...mockProduct2, status: ProductStatus.SOLD };
      prisma.product.findMany.mockResolvedValue([mockProduct1, soldProduct]);

      await expect(
        service.create(tenantId, userId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, userId, createOrderDto),
      ).rejects.toThrow("일부 상품이 판매 불가 상태입니다.");
      expect(prisma.executeInTransaction).not.toHaveBeenCalled();
    });

    it("예약(RESERVED) 상태 상품이 포함되면 BadRequestException을 던진다", async () => {
      const reservedProduct = {
        ...mockProduct2,
        status: ProductStatus.RESERVED,
      };
      prisma.product.findMany.mockResolvedValue([
        mockProduct1,
        reservedProduct,
      ]);

      await expect(
        service.create(tenantId, userId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, userId, createOrderDto),
      ).rejects.toThrow("일부 상품이 판매 불가 상태입니다.");
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    it("사용자의 주문 목록을 페이지네이션하여 반환한다", async () => {
      const orders = [mockOrder];
      prisma.order.findMany.mockResolvedValue(orders);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, userId, {
        page: 1,
        limit: 10,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { tenantId, userId },
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
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { tenantId, userId },
      });
      expect(result).toEqual({
        data: orders,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it("상태 필터를 적용하여 조회한다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(tenantId, userId, {
        status: OrderStatus.PAID,
        page: 1,
        limit: 10,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, userId, status: OrderStatus.PAID },
        }),
      );
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { tenantId, userId, status: OrderStatus.PAID },
      });
    });

    it("페이지네이션 기본값(page=1, limit=10)을 적용한다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(tenantId, userId, {});

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it("2페이지 조회 시 skip 값이 올바르다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(15);

      const result = await service.findAll(tenantId, userId, {
        page: 2,
        limit: 10,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("주문 상세를 반환한다", async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await service.findOne(userId, "order-uuid-1");

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: "order-uuid-1", userId },
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
      expect(result).toEqual(mockOrder);
    });

    it("주문을 찾을 수 없으면 NotFoundException을 던진다", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, "nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, "nonexistent-id")).rejects.toThrow(
        "주문을 찾을 수 없습니다.",
      );
    });

    it("다른 사용자의 주문은 조회할 수 없다", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne("other-user", "order-uuid-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // cancel
  // ---------------------------------------------------------------------------
  describe("cancel", () => {
    it("결제 대기 상태의 주문을 정상 취소한다", async () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING_PAYMENT,
        payment: null,
      };
      prisma.order.findFirst.mockResolvedValue(pendingOrder);
      prisma.product.updateMany.mockResolvedValue({ count: 2 });
      prisma.order.update.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancel(userId, "order-uuid-1");

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: "order-uuid-1", userId },
        include: { items: true, payment: true },
      });
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["product-1", "product-2"] } },
        data: { status: ProductStatus.AVAILABLE },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-uuid-1" },
        data: { status: OrderStatus.CANCELLED },
      });
      expect(result).toEqual({ message: "주문이 취소되었습니다." });
    });

    it("주문을 찾을 수 없으면 NotFoundException을 던진다", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancel(userId, "nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancel(userId, "nonexistent-id")).rejects.toThrow(
        "주문을 찾을 수 없습니다.",
      );
    });

    it("결제 완료된 주문은 취소할 수 없다", async () => {
      const paidOrder = {
        ...mockOrder,
        status: OrderStatus.PAID,
        payment: {
          id: "payment-1",
          status: PaymentStatus.COMPLETED,
        },
      };
      prisma.order.findFirst.mockResolvedValue(paidOrder);

      await expect(service.cancel(userId, "order-uuid-1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel(userId, "order-uuid-1")).rejects.toThrow(
        "결제 완료된 주문은 취소할 수 없습니다. 고객센터에 문의해주세요.",
      );
      expect(prisma.executeInTransaction).not.toHaveBeenCalled();
    });

    it("취소 시 상품 상태를 AVAILABLE로 복원한다", async () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING_PAYMENT,
        payment: null,
      };
      prisma.order.findFirst.mockResolvedValue(pendingOrder);
      prisma.product.updateMany.mockResolvedValue({ count: 2 });
      prisma.order.update.mockResolvedValue({});

      await service.cancel(userId, "order-uuid-1");

      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["product-1", "product-2"] } },
        data: { status: ProductStatus.AVAILABLE },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // confirmPayment
  // ---------------------------------------------------------------------------
  describe("confirmPayment", () => {
    const confirmDto = {
      paymentKey: "toss-payment-key-123",
      orderId: "ORD20240101ABC123",
      amount: 2000000,
    };

    const orderForPayment = {
      id: "order-uuid-1",
      orderNumber: "ORD20240101ABC123",
      userId,
      totalAmount: 2000000,
      status: OrderStatus.PENDING_PAYMENT,
      payment: null,
    };

    const tossSuccessResponse = {
      paymentKey: "toss-payment-key-123",
      orderId: "ORD20240101ABC123",
      method: "카드",
      totalAmount: 2000000,
      status: "DONE",
    };

    beforeEach(() => {
      configService.get.mockReturnValue("test-secret-key");
    });

    it("정상적으로 결제를 확인하고 상태를 업데이트한다", async () => {
      prisma.order.findUnique.mockResolvedValue(orderForPayment);

      const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(tossSuccessResponse),
      } as any);

      prisma.payment.create.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});
      prisma.orderItem.findMany.mockResolvedValue([
        { productId: "product-1" },
        { productId: "product-2" },
      ]);
      prisma.product.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.confirmPayment(confirmDto);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: confirmDto.orderId },
        include: { payment: true },
      });

      // Toss API 호출 검증
      const encodedKey = Buffer.from("test-secret-key:").toString("base64");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${encodedKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey: confirmDto.paymentKey,
            orderId: confirmDto.orderId,
            amount: confirmDto.amount,
          }),
        },
      );

      // 결제 정보 생성 검증 (order.payment가 null이므로 create)
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: "order-uuid-1",
          method: "CARD",
          amount: 2000000,
          status: PaymentStatus.COMPLETED,
          transactionId: "toss-payment-key-123",
          pgProvider: "TOSS",
          pgResponse: tossSuccessResponse,
          paidAt: expect.any(Date),
        }),
      });

      // 주문 상태 PAID 변경 검증
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-uuid-1" },
        data: {
          status: OrderStatus.PAID,
          paidAt: expect.any(Date),
        },
      });

      // 상품 상태 SOLD 변경 검증
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["product-1", "product-2"] } },
        data: { status: ProductStatus.SOLD },
      });

      expect(result).toEqual({
        message: "결제가 완료되었습니다.",
        orderNumber: "ORD20240101ABC123",
      });
    });

    it("기존 결제 정보가 있으면 update를 호출한다", async () => {
      const orderWithPayment = {
        ...orderForPayment,
        payment: {
          id: "existing-payment-id",
          status: PaymentStatus.PENDING,
        },
      };
      prisma.order.findUnique.mockResolvedValue(orderWithPayment);

      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(tossSuccessResponse),
      } as any);

      prisma.payment.update.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});
      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await service.confirmPayment(confirmDto);

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "existing-payment-id" },
        data: expect.objectContaining({
          status: PaymentStatus.COMPLETED,
          transactionId: "toss-payment-key-123",
          pgProvider: "TOSS",
          paidAt: expect.any(Date),
        }),
      });
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it("주문을 찾을 수 없으면 NotFoundException을 던진다", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        "주문을 찾을 수 없습니다.",
      );
    });

    it("결제 대기 상태가 아니면 BadRequestException을 던진다", async () => {
      const paidOrder = {
        ...orderForPayment,
        status: OrderStatus.PAID,
      };
      prisma.order.findUnique.mockResolvedValue(paidOrder);

      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        "결제 대기 상태가 아닙니다.",
      );
    });

    it("결제 금액이 일치하지 않으면 BadRequestException을 던진다", async () => {
      prisma.order.findUnique.mockResolvedValue(orderForPayment);

      const wrongAmountDto = { ...confirmDto, amount: 999999 };

      await expect(service.confirmPayment(wrongAmountDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmPayment(wrongAmountDto)).rejects.toThrow(
        "결제 금액이 일치하지 않습니다.",
      );
    });

    it("Toss API가 실패 응답을 반환하면 BadRequestException을 던진다", async () => {
      prisma.order.findUnique.mockResolvedValue(orderForPayment);

      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          code: "ALREADY_PROCESSED_PAYMENT",
          message: "이미 처리된 결제입니다.",
        }),
      } as any);

      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        "이미 처리된 결제입니다.",
      );
    });

    it("Toss API 에러 메시지가 없으면 기본 메시지를 사용한다", async () => {
      prisma.order.findUnique.mockResolvedValue(orderForPayment);

      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      } as any);

      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        "결제 승인에 실패했습니다.",
      );
    });

    it("Toss API 네트워크 오류 시 BadRequestException을 던진다", async () => {
      prisma.order.findUnique.mockResolvedValue(orderForPayment);

      jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmPayment(confirmDto)).rejects.toThrow(
        "결제 승인 중 오류가 발생했습니다.",
      );
    });

    it("카드 결제가 아닌 경우 BANK_TRANSFER로 결제 방식을 설정한다", async () => {
      prisma.order.findUnique.mockResolvedValue(orderForPayment);

      const bankTransferResponse = {
        ...tossSuccessResponse,
        method: "계좌이체",
      };

      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(bankTransferResponse),
      } as any);

      prisma.payment.create.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});
      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await service.confirmPayment(confirmDto);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          method: "BANK_TRANSFER",
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findByOrderNumber
  // ---------------------------------------------------------------------------
  describe("findByOrderNumber", () => {
    it("주문번호로 주문을 조회한다", async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber("ORD20240101ABC123");

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { orderNumber: "ORD20240101ABC123" },
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
      expect(result).toEqual(mockOrder);
    });

    it("주문번호로 찾을 수 없으면 NotFoundException을 던진다", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findByOrderNumber("INVALID-NUMBER")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByOrderNumber("INVALID-NUMBER")).rejects.toThrow(
        "주문을 찾을 수 없습니다.",
      );
    });
  });
});
