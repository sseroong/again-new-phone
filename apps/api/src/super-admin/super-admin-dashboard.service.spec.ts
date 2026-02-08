import { Test, TestingModule } from "@nestjs/testing";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { SuperAdminDashboardService } from "./super-admin-dashboard.service";
import { SuperAdminDashboardQueryDto } from "./dto";

describe("SuperAdminDashboardService", () => {
  let service: SuperAdminDashboardService;
  let prisma: MockPrismaService;

  const mockTenantStats = [
    {
      id: "tenant-1",
      name: "폰가비",
      slug: "phonegabi",
      _count: { users: 10, products: 50, orders: 30 },
    },
    {
      id: "tenant-2",
      name: "테스트",
      slug: "test",
      _count: { users: 5, products: 20, orders: 10 },
    },
  ];

  /**
   * 모든 6개 Prisma 호출에 대한 기본 mock을 설정한다.
   * tenant.count는 두 번 호출되므로 mockResolvedValueOnce를 사용한다.
   */
  function setupDefaultMocks(overrides?: {
    totalTenants?: number;
    activeTenants?: number;
    userCount?: number;
    orderCount?: number;
    paymentAggregate?: { _sum: { amount: number | null } };
    tenantStats?: any[];
  }) {
    const defaults = {
      totalTenants: 5,
      activeTenants: 3,
      userCount: 320,
      orderCount: 42,
      paymentAggregate: { _sum: { amount: 15000000 } },
      tenantStats: mockTenantStats,
      ...overrides,
    };

    // tenant.count는 두 번 호출됨: totalTenants, activeTenants
    prisma.tenant.count
      .mockResolvedValueOnce(defaults.totalTenants)
      .mockResolvedValueOnce(defaults.activeTenants);
    prisma.user.count.mockResolvedValue(defaults.userCount);
    prisma.order.count.mockResolvedValue(defaults.orderCount);
    prisma.payment.aggregate.mockResolvedValue(defaults.paymentAggregate);
    prisma.tenant.findMany.mockResolvedValue(defaults.tenantStats);
  }

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminDashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuperAdminDashboardService>(
      SuperAdminDashboardService,
    );
    prisma = mockPrisma;
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
    it("기본 글로벌 통계를 반환한다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = {};
      const result = await service.getStats(query);

      expect(result).toEqual({
        stats: {
          totalTenants: 5,
          activeTenants: 3,
          totalUsers: 320,
          totalOrders: 42,
          totalRevenue: 15000000,
        },
        tenantStats: mockTenantStats,
      });
    });

    it("반환값 구조가 stats와 tenantStats를 포함한다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = {};
      const result = await service.getStats(query);

      expect(result).toHaveProperty("stats");
      expect(result).toHaveProperty("tenantStats");
      expect(result.stats).toHaveProperty("totalTenants");
      expect(result.stats).toHaveProperty("activeTenants");
      expect(result.stats).toHaveProperty("totalUsers");
      expect(result.stats).toHaveProperty("totalOrders");
      expect(result.stats).toHaveProperty("totalRevenue");
    });

    it("날짜 필터 적용 시 createdAt/paidAt 조건이 포함된다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = {
        startDate: "2024-06-01",
        endDate: "2024-06-30",
      };
      await service.getStats(query);

      const expectedDateFilter = {
        gte: new Date("2024-06-01"),
        lte: new Date("2024-06-30T23:59:59.999Z"),
      };

      // order.count에 createdAt 필터가 적용되어야 한다
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          createdAt: expectedDateFilter,
          status: { not: OrderStatus.CANCELLED },
        },
      });

      // payment.aggregate에 paidAt 필터가 적용되어야 한다
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: expectedDateFilter,
        },
      });
    });

    it("startDate만 지정 시 gte 조건만 적용된다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = { startDate: "2024-06-01" };
      await service.getStats(query);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          createdAt: { gte: new Date("2024-06-01") },
          status: { not: OrderStatus.CANCELLED },
        },
      });

      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: new Date("2024-06-01") },
        },
      });
    });

    it("endDate만 지정 시 lte 조건만 적용된다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = { endDate: "2024-06-30" };
      await service.getStats(query);

      expect(prisma.order.count).toHaveBeenCalledWith({
        where: {
          createdAt: { lte: new Date("2024-06-30T23:59:59.999Z") },
          status: { not: OrderStatus.CANCELLED },
        },
      });

      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { lte: new Date("2024-06-30T23:59:59.999Z") },
        },
      });
    });

    it("매출이 없을 때 totalRevenue가 0을 반환한다", async () => {
      setupDefaultMocks({
        totalTenants: 2,
        activeTenants: 1,
        userCount: 5,
        orderCount: 0,
        paymentAggregate: { _sum: { amount: null } },
        tenantStats: [],
      });

      const query: SuperAdminDashboardQueryDto = {};
      const result = await service.getStats(query);

      expect(result.stats.totalRevenue).toBe(0);
      expect(result.stats.totalOrders).toBe(0);
    });

    it("테넌트별 통계가 포함된다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = {};
      const result = await service.getStats(query);

      expect(result.tenantStats).toHaveLength(2);
      expect(result.tenantStats).toEqual(mockTenantStats);

      // 각 테넌트 통계 항목의 구조 검증
      expect(result.tenantStats[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
          _count: expect.objectContaining({
            users: expect.any(Number),
            products: expect.any(Number),
            orders: expect.any(Number),
          }),
        }),
      );

      // tenant.findMany 호출 인자 검증
      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
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
        orderBy: { createdAt: "asc" },
      });
    });

    it("6개의 Prisma 호출이 모두 실행된다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = {};
      await service.getStats(query);

      // tenant.count는 2회 호출 (totalTenants + activeTenants)
      expect(prisma.tenant.count).toHaveBeenCalledTimes(2);
      expect(prisma.user.count).toHaveBeenCalledTimes(1);
      expect(prisma.order.count).toHaveBeenCalledTimes(1);
      expect(prisma.payment.aggregate).toHaveBeenCalledTimes(1);
      expect(prisma.tenant.findMany).toHaveBeenCalledTimes(1);
    });

    it("tenantId 필터 없이 글로벌 조회를 수행한다", async () => {
      setupDefaultMocks();

      const query: SuperAdminDashboardQueryDto = {};
      await service.getStats(query);

      // order.count 호출에 tenantId가 포함되지 않아야 한다
      const orderCountCall = prisma.order.count.mock.calls[0][0];
      expect(orderCountCall.where).not.toHaveProperty("tenantId");

      // payment.aggregate 호출에 tenantId가 포함되지 않아야 한다
      const paymentAggCall = prisma.payment.aggregate.mock.calls[0][0];
      expect(paymentAggCall.where).not.toHaveProperty("tenantId");

      // user.count 호출에 tenantId가 포함되지 않아야 한다
      expect(prisma.user.count).toHaveBeenCalledWith();

      // tenant.count 호출에도 tenantId 필터 없이 전체/활성 카운트만
      expect(prisma.tenant.count).toHaveBeenNthCalledWith(1);
      expect(prisma.tenant.count).toHaveBeenNthCalledWith(2, {
        where: { isActive: true },
      });
    });
  });
});
