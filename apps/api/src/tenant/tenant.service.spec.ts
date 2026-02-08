import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { TenantService } from "./tenant.service";

describe("TenantService", () => {
  let service: TenantService;
  let prisma: MockPrismaService;

  const mockTenant = {
    id: "default-tenant",
    name: "폰가비",
    slug: "phonegabi",
    domain: null,
    settings: {},
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = mockPrisma;
  });

  it("서비스가 정의되어 있는지", () => {
    expect(service).toBeDefined();
  });

  describe("findById", () => {
    it("ID로 테넌트를 조회한다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById("default-tenant");

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: "default-tenant" },
      });
      expect(result).toEqual(mockTenant);
    });

    it("존재하지 않는 테넌트이면 null을 반환한다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findBySlug", () => {
    it("slug으로 테넌트를 조회한다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug("phonegabi");

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: "phonegabi" },
      });
      expect(result).toEqual(mockTenant);
    });

    it("존재하지 않는 slug이면 null을 반환한다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByDomain", () => {
    it("도메인으로 테넌트를 조회한다", async () => {
      const tenantWithDomain = {
        ...mockTenant,
        domain: "busan.phonmarket.com",
      };
      prisma.tenant.findUnique.mockResolvedValue(tenantWithDomain);

      const result = await service.findByDomain("busan.phonmarket.com");

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { domain: "busan.phonmarket.com" },
      });
      expect(result).toEqual(tenantWithDomain);
    });

    it("존재하지 않는 도메인이면 null을 반환한다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findByDomain("unknown.example.com");

      expect(result).toBeNull();
    });
  });

  describe("resolve", () => {
    const activeTenant = { ...mockTenant, domain: "test.example.com" };
    const inactiveTenant = {
      ...mockTenant,
      isActive: false,
      domain: "inactive.example.com",
    };
    const defaultTenant = { ...mockTenant, id: "default-tenant" };

    it("도메인으로 활성 테넌트를 찾는다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);

      const result = await service.resolve("test.example.com");

      expect(result).toEqual(activeTenant);
    });

    it("비활성 도메인 테넌트는 건너뛰고 slug으로 조회한다", async () => {
      prisma.tenant.findUnique
        .mockResolvedValueOnce(inactiveTenant) // findByDomain
        .mockResolvedValueOnce(activeTenant); // findBySlug

      const result = await service.resolve("inactive.example.com", "phonegabi");

      expect(result).toEqual(activeTenant);
    });

    it("파라미터가 없으면 기본 테넌트를 반환한다", async () => {
      prisma.tenant.findUnique.mockResolvedValue(defaultTenant);

      const result = await service.resolve();

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: "default-tenant" },
      });
      expect(result).toEqual(defaultTenant);
    });

    it("도메인과 slug 모두 실패하면 기본 테넌트를 반환한다", async () => {
      prisma.tenant.findUnique
        .mockResolvedValueOnce(null) // findByDomain
        .mockResolvedValueOnce(null) // findBySlug
        .mockResolvedValueOnce(defaultTenant); // findById(DEFAULT_TENANT_ID)

      const result = await service.resolve("unknown.com", "unknown-slug");

      expect(result).toEqual(defaultTenant);
    });
  });

  describe("getDefaultTenantId", () => {
    it("기본 테넌트 ID를 반환한다", async () => {
      const result = await service.getDefaultTenantId();

      expect(result).toBe("default-tenant");
    });
  });
});
