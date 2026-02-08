import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { ProductStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { ProductsService } from "../products/products.service";
import { SellRequestsService } from "../sell-requests/sell-requests.service";
import { ReviewsService } from "../reviews/reviews.service";
import { TenantGuard } from "./tenant.guard";

// ---------------------------------------------------------------------------
// 테넌트 격리 통합 테스트
// ---------------------------------------------------------------------------
describe("멀티테넌트 데이터 격리", () => {
  const TENANT_A = "tenant-a-uuid";
  const TENANT_B = "tenant-b-uuid";
  const USER_A = "user-a-uuid";
  const USER_B = "user-b-uuid";

  // =========================================================================
  // ProductsService 격리
  // =========================================================================
  describe("ProductsService 격리", () => {
    let service: ProductsService;
    let prisma: MockPrismaService;

    beforeEach(async () => {
      prisma = createMockPrismaService();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProductsService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get<ProductsService>(ProductsService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("tenantA의 findAll에 tenantA의 tenantId가 전달된다", async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll(TENANT_A, {});

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      });
    });

    it("tenantB의 tenantId로 조회하면 tenantB의 where 조건이 사용된다", async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll(TENANT_B, {});

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_B }),
        }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: TENANT_B }),
      });
    });

    it("서로 다른 tenantId로 독립적인 쿼리가 실행된다", async () => {
      const productA = {
        id: "product-a",
        tenantId: TENANT_A,
        status: ProductStatus.AVAILABLE,
      };
      const productB = {
        id: "product-b",
        tenantId: TENANT_B,
        status: ProductStatus.AVAILABLE,
      };

      // tenantA 조회
      prisma.product.findMany.mockResolvedValueOnce([productA]);
      prisma.product.count.mockResolvedValueOnce(1);
      const resultA = await service.findAll(TENANT_A, {});

      // tenantB 조회
      prisma.product.findMany.mockResolvedValueOnce([productB]);
      prisma.product.count.mockResolvedValueOnce(1);
      const resultB = await service.findAll(TENANT_B, {});

      // 각 호출이 올바른 tenantId를 사용했는지 확인
      const findManyCalls = prisma.product.findMany.mock.calls;
      expect(findManyCalls[0][0].where.tenantId).toBe(TENANT_A);
      expect(findManyCalls[1][0].where.tenantId).toBe(TENANT_B);

      // 반환된 데이터가 각 테넌트에 해당하는지 확인
      expect(resultA.data).toEqual([productA]);
      expect(resultB.data).toEqual([productB]);
    });
  });

  // =========================================================================
  // SellRequestsService 격리
  // =========================================================================
  describe("SellRequestsService 격리", () => {
    let service: SellRequestsService;
    let prisma: MockPrismaService;

    beforeEach(async () => {
      prisma = createMockPrismaService();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SellRequestsService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get<SellRequestsService>(SellRequestsService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("tenantA의 findAll에 tenantA의 tenantId가 전달된다", async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      await service.findAll(TENANT_A, USER_A, {});

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_A }),
        }),
      );
      expect(prisma.sellRequest.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: TENANT_A }),
      });
    });

    it("사용자와 테넌트 모두 where 조건에 포함된다", async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      await service.findAll(TENANT_A, USER_A, {});

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A,
            userId: USER_A,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // ReviewsService 격리
  // =========================================================================
  describe("ReviewsService 격리", () => {
    let service: ReviewsService;
    let prisma: MockPrismaService;

    beforeEach(async () => {
      prisma = createMockPrismaService();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ReviewsService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      service = module.get<ReviewsService>(ReviewsService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("tenantA의 findAll에 tenantA의 tenantId가 전달된다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(0);

      await service.findAll(TENANT_A, {});

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_A,
            isPublished: true,
          }),
        }),
      );
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: TENANT_A,
          isPublished: true,
        }),
      });
    });

    it("테넌트별 독립 조회 확인", async () => {
      const reviewA = {
        id: "review-a",
        tenantId: TENANT_A,
        isPublished: true,
        user: { id: USER_A, name: "사용자A" },
      };
      const reviewB = {
        id: "review-b",
        tenantId: TENANT_B,
        isPublished: true,
        user: { id: USER_B, name: "사용자B" },
      };

      // tenantA 조회
      prisma.review.findMany.mockResolvedValueOnce([reviewA]);
      prisma.review.count.mockResolvedValueOnce(1);
      const resultA = await service.findAll(TENANT_A, {});

      // tenantB 조회
      prisma.review.findMany.mockResolvedValueOnce([reviewB]);
      prisma.review.count.mockResolvedValueOnce(1);
      const resultB = await service.findAll(TENANT_B, {});

      // 각 호출의 where 조건에 올바른 tenantId가 포함되었는지 확인
      const findManyCalls = prisma.review.findMany.mock.calls;
      expect(findManyCalls[0][0].where.tenantId).toBe(TENANT_A);
      expect(findManyCalls[1][0].where.tenantId).toBe(TENANT_B);

      // 반환 데이터가 올바른지 확인
      expect(resultA.data).toEqual([reviewA]);
      expect(resultB.data).toEqual([reviewB]);
    });
  });

  // =========================================================================
  // TenantGuard 접근 제어
  // =========================================================================
  describe("TenantGuard 접근 제어", () => {
    let guard: TenantGuard;
    let prisma: MockPrismaService;

    const createMockContext = (user: any, tenantId: string | null) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ user, tenantId }),
        }),
      }) as any;

    beforeEach(async () => {
      prisma = createMockPrismaService();

      const module: TestingModule = await Test.createTestingModule({
        providers: [TenantGuard, { provide: PrismaService, useValue: prisma }],
      }).compile();

      guard = module.get<TenantGuard>(TenantGuard);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("SUPER_ADMIN은 모든 테넌트 접근 가능", async () => {
      const superAdmin = { id: "super-admin-1", role: UserRole.SUPER_ADMIN };

      const resultA = await guard.canActivate(
        createMockContext(superAdmin, TENANT_A),
      );
      const resultB = await guard.canActivate(
        createMockContext(superAdmin, TENANT_B),
      );

      expect(resultA).toBe(true);
      expect(resultB).toBe(true);
      expect(prisma.userTenant.findUnique).not.toHaveBeenCalled();
    });

    it("일반 사용자의 소속 테넌트 접근 허용", async () => {
      const user = { id: USER_A, role: UserRole.USER };
      prisma.userTenant.findUnique.mockResolvedValue({
        userId: USER_A,
        tenantId: TENANT_A,
        isActive: true,
        role: UserRole.USER,
      });

      const result = await guard.canActivate(createMockContext(user, TENANT_A));

      expect(result).toBe(true);
      expect(prisma.userTenant.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tenantId: {
            userId: USER_A,
            tenantId: TENANT_A,
          },
        },
      });
    });

    it("일반 사용자의 비소속 테넌트 접근 차단 (ForbiddenException)", async () => {
      const user = { id: USER_A, role: UserRole.USER };
      prisma.userTenant.findUnique.mockResolvedValue(null);

      await expect(
        guard.canActivate(createMockContext(user, TENANT_B)),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        guard.canActivate(createMockContext(user, TENANT_B)),
      ).rejects.toThrow("해당 테넌트에 대한 접근 권한이 없습니다.");
    });

    it("비활성 UserTenant 레코드의 접근 차단", async () => {
      const user = { id: USER_A, role: UserRole.USER };
      prisma.userTenant.findUnique.mockResolvedValue({
        userId: USER_A,
        tenantId: TENANT_A,
        isActive: false,
        role: UserRole.USER,
      });

      await expect(
        guard.canActivate(createMockContext(user, TENANT_A)),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        guard.canActivate(createMockContext(user, TENANT_A)),
      ).rejects.toThrow("해당 테넌트에 대한 접근 권한이 없습니다.");
    });

    it("테넌트 정보가 없으면 차단", async () => {
      const user = { id: USER_A, role: UserRole.USER };

      await expect(
        guard.canActivate(createMockContext(user, null)),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        guard.canActivate(createMockContext(user, null)),
      ).rejects.toThrow("테넌트 정보가 없습니다.");
    });

    it("Public 엔드포인트는 사용자 없이도 통과", async () => {
      const result = await guard.canActivate(createMockContext(null, TENANT_A));

      expect(result).toBe(true);
      expect(prisma.userTenant.findUnique).not.toHaveBeenCalled();
    });
  });
});
