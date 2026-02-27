import { Test, TestingModule } from "@nestjs/testing";
import { OrderStatus, PaymentStatus, SellRequestStatus } from "@prisma/client";
import { AdminDashboardService } from "./admin-dashboard.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { DashboardQueryDto } from "./dto";

describe("AdminDashboardService", () => {
  let service: AdminDashboardService;
  let prisma: MockPrismaService;

  const tenantId = "default-tenant";
  const mockRecentOrder = {
    id: "order-uuid-1",
    userId: "user-uuid-1",
    status: OrderStatus.PAID,
    totalAmount: 850000,
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2024-06-15"),
    user: { id: "user-uuid-1", name: "홍길동", email: "hong@example.com" },
    items: [
      {
        id: "item-uuid-1",
        product: {
          id: "product-uuid-1",
          model: { id: "model-uuid-1", name: "iPhone 15 Pro" },
          variant: { id: "variant-uuid-1", storage: "256GB" },
        },
      },
    ],
  };

  const mockRecentSellRequest = {
    id: "sell-req-uuid-1",
    userId: "user-uuid-2",
    status: SellRequestStatus.PENDING,
    createdAt: new Date("2024-06-14"),
    updatedAt: new Date("2024-06-14"),
    user: { id: "user-uuid-2", name: "김철수", email: "kim@example.com" },
  };

  /**
   * 모든 6개 Prisma 호출에 대한 기본 mock을 설정한다.
   * 개별 테스트에서 필요한 mock만 override할 수 있도록 헬퍼로 분리.
   */
  function setupDefaultMocks(overrides?: {
    orderCount?: number;
    paymentAggregate?: { _sum: { amount: number | null } };
    userCount?: number;
    sellRequestCount?: number;
    recentOrders?: any[];
    recentSellRequests?: any[];
  }) {
    const defaults = {
      orderCount: 42,
      paymentAggregate: { _sum: { amount: 15000000 } },
      userCount: 320,
      sellRequestCount: 8,
      recentOrders: [mockRecentOrder],
      recentSellRequests: [mockRecentSellRequest],
      ...overrides,
    };

    prisma.order.count.mockResolvedValue(defaults.orderCount);
    prisma.payment.aggregate.mockResolvedValue(defaults.paymentAggregate);
    prisma.user.count.mockResolvedValue(defaults.userCount);
    prisma.sellRequest.count.mockResolvedValue(defaults.sellRequestCount);
    prisma.order.findMany.mockResolvedValue(defaults.recentOrders);
    prisma.sellRequest.findMany.mockResolvedValue(defaults.recentSellRequests);
  }

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 서비스 정의 확인
  // ---------------------------------------------------------------------------
  it("서비스가 정의되어 있어야 한다", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getStats
  // ---------------------------------------------------------------------------
  describe("getStats", () => {
    it("기본 통계를 반환한다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = {};
      const result = await service.getStats(tenantId, query);

      // 총 주문 수 조회 - 취소 주문 제외
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: { not: OrderStatus.CANCELLED },
        },
      });

      // 총 매출 조회 - 결제 완료 건만
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          tenantId,
          status: PaymentStatus.COMPLETED,
        },
      });

      // 활성 회원 수 조회
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });

      // 대기 중인 판매접수 수 조회
      expect(prisma.sellRequest.count).toHaveBeenCalledWith({
        where: { tenantId, status: SellRequestStatus.PENDING },
      });

      // 최근 주문 5건 조회
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: "desc" },
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
      });

      // 최근 판매접수 5건 조회
      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // 반환값 구조 검증
      expect(result).toEqual({
        stats: {
          totalOrders: 42,
          totalRevenue: 15000000,
          activeUsers: 320,
          pendingSellRequests: 8,
        },
        recentOrders: [mockRecentOrder],
        recentSellRequests: [mockRecentSellRequest],
      });
    });

    it("날짜 필터 적용 시 createdAt/paidAt 조건이 포함된다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = {
        startDate: "2024-06-01",
        endDate: "2024-06-30",
      };
      await service.getStats(tenantId, query);

      const expectedDateFilter = {
        gte: new Date("2024-06-01"),
        lte: new Date("2024-06-30T23:59:59.999Z"),
      };

      // order.count에 createdAt 필터가 적용되어야 한다
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          createdAt: expectedDateFilter,
          status: { not: OrderStatus.CANCELLED },
        },
      });

      // payment.aggregate에 paidAt 필터가 적용되어야 한다
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          tenantId,
          status: PaymentStatus.COMPLETED,
          paidAt: expectedDateFilter,
        },
      });
    });

    it("startDate만 지정 시 gte 조건만 적용된다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = { startDate: "2024-06-01" };
      await service.getStats(tenantId, query);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          createdAt: { gte: new Date("2024-06-01") },
          status: { not: OrderStatus.CANCELLED },
        },
      });

      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          tenantId,
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: new Date("2024-06-01") },
        },
      });
    });

    it("endDate만 지정 시 lte 조건만 적용된다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = { endDate: "2024-06-30" };
      await service.getStats(tenantId, query);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          createdAt: { lte: new Date("2024-06-30T23:59:59.999Z") },
          status: { not: OrderStatus.CANCELLED },
        },
      });

      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          tenantId,
          status: PaymentStatus.COMPLETED,
          paidAt: { lte: new Date("2024-06-30T23:59:59.999Z") },
        },
      });
    });

    it("매출이 없을 때 totalRevenue가 0을 반환한다", async () => {
      setupDefaultMocks({
        orderCount: 0,
        paymentAggregate: { _sum: { amount: null } },
        userCount: 5,
        sellRequestCount: 0,
        recentOrders: [],
        recentSellRequests: [],
      });

      const query: DashboardQueryDto = {};
      const result = await service.getStats(tenantId, query);

      expect(result.stats.totalRevenue).toBe(0);
      expect(result.stats.totalOrders).toBe(0);
      expect(result.stats.activeUsers).toBe(5);
      expect(result.stats.pendingSellRequests).toBe(0);
    });

    it("최근 주문과 판매접수 목록을 포함한다", async () => {
      const multipleOrders = [
        mockRecentOrder,
        {
          ...mockRecentOrder,
          id: "order-uuid-2",
          totalAmount: 500000,
          createdAt: new Date("2024-06-14"),
        },
        {
          ...mockRecentOrder,
          id: "order-uuid-3",
          totalAmount: 1200000,
          createdAt: new Date("2024-06-13"),
        },
      ];

      const multipleSellRequests = [
        mockRecentSellRequest,
        {
          ...mockRecentSellRequest,
          id: "sell-req-uuid-2",
          createdAt: new Date("2024-06-13"),
          user: {
            id: "user-uuid-3",
            name: "이영희",
            email: "lee@example.com",
          },
        },
      ];

      setupDefaultMocks({
        recentOrders: multipleOrders,
        recentSellRequests: multipleSellRequests,
      });

      const query: DashboardQueryDto = {};
      const result = await service.getStats(tenantId, query);

      expect(result.recentOrders).toHaveLength(3);
      expect(result.recentOrders).toEqual(multipleOrders);
      expect(result.recentSellRequests).toHaveLength(2);
      expect(result.recentSellRequests).toEqual(multipleSellRequests);

      // 최근 주문에 user, items 관계가 포함되어야 한다
      expect(result.recentOrders[0]).toHaveProperty("user");
      expect(result.recentOrders[0]).toHaveProperty("items");
      expect(result.recentOrders[0].user).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        }),
      );

      // 최근 판매접수에 user 관계가 포함되어야 한다
      expect(result.recentSellRequests[0]).toHaveProperty("user");
      expect(result.recentSellRequests[0].user).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        }),
      );
    });

    it("날짜 필터 적용 시 recentOrders에도 createdAt 조건이 포함된다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = {
        startDate: "2024-06-01",
        endDate: "2024-06-30",
      };
      await service.getStats(tenantId, query);

      const expectedDateFilter = {
        gte: new Date("2024-06-01"),
        lte: new Date("2024-06-30T23:59:59.999Z"),
      };

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { tenantId, createdAt: expectedDateFilter },
        take: 5,
        orderBy: { createdAt: "desc" },
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
      });
    });

    it("날짜 필터 적용 시 recentSellRequests에도 createdAt 조건이 포함된다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = {
        startDate: "2024-06-01",
        endDate: "2024-06-30",
      };
      await service.getStats(tenantId, query);

      const expectedDateFilter = {
        gte: new Date("2024-06-01"),
        lte: new Date("2024-06-30T23:59:59.999Z"),
      };

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId, createdAt: expectedDateFilter },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("날짜 필터 없을 때 recentOrders/recentSellRequests는 tenantId만으로 조회한다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = {};
      await service.getStats(tenantId, query);

      // recentOrders - dateFilter가 빈 객체이므로 spread 결과는 tenantId만
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: "desc" },
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
      });

      // recentSellRequests
      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it("6개의 Prisma 호출이 모두 실행된다", async () => {
      setupDefaultMocks();

      const query: DashboardQueryDto = {};
      await service.getStats(tenantId, query);

      expect(prisma.order.count).toHaveBeenCalledTimes(1);
      expect(prisma.payment.aggregate).toHaveBeenCalledTimes(1);
      expect(prisma.user.count).toHaveBeenCalledTimes(1);
      expect(prisma.sellRequest.count).toHaveBeenCalledTimes(1);
      expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.sellRequest.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
