import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { AdminOrdersService } from "./admin-orders.service";

describe("AdminOrdersService", () => {
  let service: AdminOrdersService;
  let prisma: MockPrismaService;

  const tenantId = "default-tenant";

  const mockOrder = {
    id: "order-1",
    orderNumber: "ORD-20240101-0001",
    userId: "user-1",
    status: OrderStatus.PAID,
    shippingName: "홍길동",
    shippingPhone: "010-1234-5678",
    shippingAddress: "서울시 강남구",
    trackingNumber: null,
    trackingCompany: null,
    totalAmount: 500000,
    shippedAt: null,
    deliveredAt: null,
    completedAt: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  const mockOrderWithRelations = {
    ...mockOrder,
    user: { id: "user-1", name: "홍길동", email: "hong@example.com" },
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 1,
        price: 500000,
        product: {
          id: "product-1",
          name: "iPhone 15 Pro",
          model: { id: "model-1", name: "iPhone 15 Pro" },
          variant: { id: "variant-1", storage: "256GB" },
        },
      },
    ],
    payment: {
      id: "payment-1",
      orderId: "order-1",
      amount: 500000,
      method: "CARD",
    },
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminOrdersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminOrdersService>(AdminOrdersService);
    prisma = mockPrisma;
  });

  it("서비스가 정의되어 있는지", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("전체 주문 목록을 반환한다", async () => {
      const orders = [mockOrderWithRelations];
      prisma.order.findMany.mockResolvedValue(orders);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, {});

      expect(result).toEqual({
        data: orders,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: 20,
        }),
      );
      expect(prisma.order.count).toHaveBeenCalledWith({ where: { tenantId } });
    });

    it("상태 필터를 적용한다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(tenantId, { status: OrderStatus.PAID });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, status: OrderStatus.PAID },
        }),
      );
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { tenantId, status: OrderStatus.PAID },
      });
    });

    it("userId 필터를 적용한다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(tenantId, { userId: "user-1" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, userId: "user-1" },
        }),
      );
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { tenantId, userId: "user-1" },
      });
    });

    it("검색어 필터를 적용한다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findAll(tenantId, { search: "홍길동" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            OR: [
              { orderNumber: { contains: "홍길동", mode: "insensitive" } },
              { shippingName: { contains: "홍길동", mode: "insensitive" } },
            ],
          },
        }),
      );
    });

    it("페이지네이션을 적용한다", async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(50);

      const result = await service.findAll(tenantId, { page: 3, limit: 10 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });
  });

  describe("findOne", () => {
    it("주문 상세를 반환한다", async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderWithRelations);

      const result = await service.findOne("order-1");

      expect(result).toEqual(mockOrderWithRelations);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
        include: expect.objectContaining({
          user: expect.any(Object),
          items: expect.any(Object),
          payment: true,
        }),
      });
    });

    it("주문이 없으면 NotFoundException", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateStatus", () => {
    it("유효한 상태 전환을 허용한다 (PAID -> PREPARING)", async () => {
      const paidOrder = { ...mockOrder, status: OrderStatus.PAID };
      const updatedOrder = {
        ...mockOrderWithRelations,
        status: OrderStatus.PREPARING,
      };
      prisma.order.findUnique.mockResolvedValue(paidOrder);
      prisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus("order-1", {
        status: OrderStatus.PREPARING,
      });

      expect(result.status).toBe(OrderStatus.PREPARING);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order-1" },
          data: { status: OrderStatus.PREPARING },
        }),
      );
    });

    it("잘못된 상태 전환이면 BadRequestException (COMPLETED -> PAID)", async () => {
      const completedOrder = { ...mockOrder, status: OrderStatus.COMPLETED };
      prisma.order.findUnique.mockResolvedValue(completedOrder);

      await expect(
        service.updateStatus("order-1", { status: OrderStatus.PAID }),
      ).rejects.toThrow(BadRequestException);
    });

    it("존재하지 않는 주문이면 NotFoundException", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus("nonexistent", {
          status: OrderStatus.PREPARING,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("SHIPPING 상태로 변경 시 shippedAt을 설정한다", async () => {
      const preparingOrder = { ...mockOrder, status: OrderStatus.PREPARING };
      prisma.order.findUnique.mockResolvedValue(preparingOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrderWithRelations,
        status: OrderStatus.SHIPPING,
        shippedAt: new Date(),
      });

      await service.updateStatus("order-1", {
        status: OrderStatus.SHIPPING,
      });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.SHIPPING,
            shippedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("DELIVERED 상태로 변경 시 deliveredAt을 설정한다", async () => {
      const shippingOrder = { ...mockOrder, status: OrderStatus.SHIPPING };
      prisma.order.findUnique.mockResolvedValue(shippingOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrderWithRelations,
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
      });

      await service.updateStatus("order-1", {
        status: OrderStatus.DELIVERED,
      });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.DELIVERED,
            deliveredAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("updateTracking", () => {
    it("송장번호를 등록한다 (PREPARING 상태)", async () => {
      const preparingOrder = { ...mockOrder, status: OrderStatus.PREPARING };
      prisma.order.findUnique.mockResolvedValue(preparingOrder);
      prisma.order.update.mockResolvedValue({
        ...preparingOrder,
        trackingNumber: "1234567890",
        trackingCompany: "CJ대한통운",
        status: OrderStatus.SHIPPING,
        shippedAt: new Date(),
      });

      const result = await service.updateTracking("order-1", {
        trackingNumber: "1234567890",
        trackingCompany: "CJ대한통운",
      });

      expect(result.trackingNumber).toBe("1234567890");
      expect(result.trackingCompany).toBe("CJ대한통운");
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order-1" },
          data: expect.objectContaining({
            trackingNumber: "1234567890",
            trackingCompany: "CJ대한통운",
          }),
        }),
      );
    });

    it("PREPARING 상태에서 SHIPPING으로 자동 변경한다", async () => {
      const preparingOrder = { ...mockOrder, status: OrderStatus.PREPARING };
      prisma.order.findUnique.mockResolvedValue(preparingOrder);
      prisma.order.update.mockResolvedValue({
        ...preparingOrder,
        trackingNumber: "1234567890",
        status: OrderStatus.SHIPPING,
        shippedAt: new Date(),
      });

      await service.updateTracking("order-1", {
        trackingNumber: "1234567890",
      });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.SHIPPING,
            shippedAt: expect.any(Date),
          }),
        }),
      );
    });

    it("잘못된 상태에서 송장 등록 시 BadRequestException", async () => {
      const paidOrder = { ...mockOrder, status: OrderStatus.PAID };
      prisma.order.findUnique.mockResolvedValue(paidOrder);

      await expect(
        service.updateTracking("order-1", {
          trackingNumber: "1234567890",
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("존재하지 않는 주문이면 NotFoundException", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTracking("nonexistent", {
          trackingNumber: "1234567890",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
