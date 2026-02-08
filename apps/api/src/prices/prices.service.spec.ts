import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ProductGrade, PriceTrend } from "@prisma/client";
import { PricesService } from "./prices.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { PriceQueryDto } from "./dto";

describe("PricesService", () => {
  let service: PricesService;
  let prisma: MockPrismaService;

  const mockCategory = {
    id: "cat-uuid-1",
    type: "SMARTPHONE",
    name: "스마트폰",
    sortOrder: 1,
  };

  const mockModel = {
    id: "model-uuid-1",
    name: "iPhone 15 Pro",
    brand: "APPLE",
    series: "iPhone 15",
    categoryId: mockCategory.id,
    isActive: true,
    releaseDate: new Date("2023-09-22"),
    category: mockCategory,
    variants: [
      { id: "var-1", storage: "128GB", color: "Black" },
      { id: "var-2", storage: "256GB", color: "Black" },
    ],
  };

  const mockPriceGuide = {
    id: "price-uuid-1",
    modelId: "model-uuid-1",
    storage: "128GB",
    grade: ProductGrade.A,
    price: 850000,
    trend: PriceTrend.STABLE,
    updatedAt: new Date("2024-06-01"),
    model: { ...mockModel, category: mockCategory },
  };

  const mockPriceGuide256 = {
    ...mockPriceGuide,
    id: "price-uuid-2",
    storage: "256GB",
    price: 950000,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PricesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PricesService>(PricesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getPriceGuides
  // ---------------------------------------------------------------------------
  describe("getPriceGuides", () => {
    it("필터 없이 전체 가격 가이드를 조회한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([mockPriceGuide]);

      const query: PriceQueryDto = {};
      const result = await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          model: { include: { category: true } },
        },
        orderBy: [
          { model: { name: "asc" } },
          { storage: "asc" },
          { grade: "asc" },
        ],
      });
      expect(result).toEqual([mockPriceGuide]);
    });

    it("modelId로 필터링하여 가격 가이드를 조회한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([
        mockPriceGuide,
        mockPriceGuide256,
      ]);

      const query: PriceQueryDto = { modelId: "model-uuid-1" };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { modelId: "model-uuid-1" },
        }),
      );
    });

    it("category로 필터링하여 가격 가이드를 조회한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([]);

      const query: PriceQueryDto = { category: "SMARTPHONE" as any };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            model: { category: { type: "SMARTPHONE" } },
          },
        }),
      );
    });

    it("brand로 필터링하여 가격 가이드를 조회한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([]);

      const query: PriceQueryDto = { brand: "APPLE" as any };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            model: { brand: "APPLE" },
          },
        }),
      );
    });

    it("category와 brand를 동시에 필터링한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([]);

      const query: PriceQueryDto = {
        category: "SMARTPHONE" as any,
        brand: "APPLE" as any,
      };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            model: {
              category: { type: "SMARTPHONE" },
              brand: "APPLE",
            },
          },
        }),
      );
    });

    it("storage로 필터링하여 가격 가이드를 조회한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([mockPriceGuide]);

      const query: PriceQueryDto = { storage: "128GB" };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storage: "128GB" },
        }),
      );
    });

    it("grade로 필터링하여 가격 가이드를 조회한다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([mockPriceGuide]);

      const query: PriceQueryDto = { grade: ProductGrade.A };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { grade: ProductGrade.A },
        }),
      );
    });

    it("modelId가 있으면 category/brand 필터는 무시된다", async () => {
      prisma.priceGuide.findMany.mockResolvedValue([]);

      const query: PriceQueryDto = {
        modelId: "model-uuid-1",
        category: "SMARTPHONE" as any,
        brand: "APPLE" as any,
      };
      await service.getPriceGuides(query);

      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { modelId: "model-uuid-1" },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getModelPrices
  // ---------------------------------------------------------------------------
  describe("getModelPrices", () => {
    it("모델별 가격 정보를 저장공간별로 그룹핑하여 반환한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(mockModel);
      prisma.priceGuide.findMany.mockResolvedValue([
        mockPriceGuide,
        mockPriceGuide256,
      ]);

      const result = await service.getModelPrices("model-uuid-1");

      expect(prisma.deviceModel.findUnique).toHaveBeenCalledWith({
        where: { id: "model-uuid-1" },
        include: { category: true, variants: true },
      });
      expect(prisma.priceGuide.findMany).toHaveBeenCalledWith({
        where: { modelId: "model-uuid-1" },
        orderBy: [{ storage: "asc" }, { grade: "asc" }],
      });
      expect(result).toEqual({
        model: mockModel,
        pricesByStorage: [
          {
            storage: "128GB",
            prices: [mockPriceGuide],
          },
          {
            storage: "256GB",
            prices: [mockPriceGuide256],
          },
        ],
      });
    });

    it("존재하지 않는 모델 조회 시 NotFoundException을 던진다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(null);

      await expect(service.getModelPrices("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getModelPrices("nonexistent-id")).rejects.toThrow(
        "모델을 찾을 수 없습니다.",
      );
      expect(prisma.priceGuide.findMany).not.toHaveBeenCalled();
    });

    it("가격 정보가 없는 모델은 빈 그룹을 반환한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(mockModel);
      prisma.priceGuide.findMany.mockResolvedValue([]);

      const result = await service.getModelPrices("model-uuid-1");

      expect(result).toEqual({
        model: mockModel,
        pricesByStorage: [],
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getPriceHistory
  // ---------------------------------------------------------------------------
  describe("getPriceHistory", () => {
    const mockHistory = [
      {
        id: "hist-1",
        modelId: "model-uuid-1",
        storage: "128GB",
        grade: ProductGrade.A,
        price: 840000,
        recordedAt: new Date("2024-05-01"),
      },
      {
        id: "hist-2",
        modelId: "model-uuid-1",
        storage: "128GB",
        grade: ProductGrade.A,
        price: 850000,
        recordedAt: new Date("2024-05-15"),
      },
    ];

    it("기본 30일 가격 이력을 조회한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getPriceHistory(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
      );

      expect(prisma.priceHistory.findMany).toHaveBeenCalledWith({
        where: {
          modelId: "model-uuid-1",
          storage: "128GB",
          grade: ProductGrade.A,
          recordedAt: { gte: expect.any(Date) },
        },
        orderBy: { recordedAt: "asc" },
      });
      expect(result).toEqual(mockHistory);
    });

    it("지정된 일수의 가격 이력을 조회한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([]);

      await service.getPriceHistory(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
        60,
      );

      const callArg = prisma.priceHistory.findMany.mock.calls[0][0];
      const startDate = callArg.where.recordedAt.gte as Date;
      const now = new Date();
      const diffDays = Math.round(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeGreaterThanOrEqual(59);
      expect(diffDays).toBeLessThanOrEqual(61);
    });
  });

  // ---------------------------------------------------------------------------
  // getPopularModels
  // ---------------------------------------------------------------------------
  describe("getPopularModels", () => {
    it("인기 모델 목록과 대표 가격을 반환한다", async () => {
      const modelsWithPrices = [
        {
          ...mockModel,
          priceGuides: [{ price: 850000, trend: PriceTrend.STABLE }],
        },
      ];
      prisma.deviceModel.findMany.mockResolvedValue(modelsWithPrices);

      const result = await service.getPopularModels();

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          priceGuides: { some: {} },
        },
        include: {
          category: true,
          priceGuides: {
            where: { grade: ProductGrade.A },
            take: 1,
          },
        },
        orderBy: { releaseDate: "desc" },
        take: 10,
      });
      expect(result).toEqual([
        expect.objectContaining({
          representativePrice: 850000,
          trend: PriceTrend.STABLE,
        }),
      ]);
    });

    it("가격 가이드가 없는 모델은 null 가격과 STABLE 트렌드를 반환한다", async () => {
      const modelsWithoutPrices = [{ ...mockModel, priceGuides: [] }];
      prisma.deviceModel.findMany.mockResolvedValue(modelsWithoutPrices);

      const result = await service.getPopularModels();

      expect(result[0].representativePrice).toBeNull();
      expect(result[0].trend).toBe(PriceTrend.STABLE);
    });

    it("limit 파라미터로 결과 수를 제한한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      await service.getPopularModels(5);

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it("기본 limit은 10이다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      await service.getPopularModels();

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayPrices
  // ---------------------------------------------------------------------------
  describe("getTodayPrices", () => {
    const mockModelsWithPrices = [
      {
        ...mockModel,
        category: { ...mockCategory, type: "SMARTPHONE" },
        priceGuides: [
          { storage: "128GB", grade: ProductGrade.S, price: 900000 },
          { storage: "128GB", grade: ProductGrade.A, price: 850000 },
        ],
      },
      {
        ...mockModel,
        id: "model-uuid-2",
        name: "Galaxy S24",
        brand: "SAMSUNG",
        category: { ...mockCategory, type: "SMARTPHONE" },
        priceGuides: [
          { storage: "256GB", grade: ProductGrade.A, price: 750000 },
        ],
      },
    ];

    it("카테고리별로 그룹핑된 오늘의 시세를 반환한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModelsWithPrices);

      const result = await service.getTodayPrices();

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          priceGuides: { some: {} },
        },
        include: {
          category: true,
          priceGuides: {
            where: {
              grade: { in: [ProductGrade.S, ProductGrade.A] },
            },
            orderBy: { storage: "asc" },
          },
        },
        orderBy: [
          { category: { sortOrder: "asc" } },
          { brand: "asc" },
          { releaseDate: "desc" },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category: expect.objectContaining({ type: "SMARTPHONE" }),
        models: expect.arrayContaining([
          expect.objectContaining({ name: "iPhone 15 Pro" }),
          expect.objectContaining({ name: "Galaxy S24" }),
        ]),
      });
    });

    it("카테고리 필터를 적용하여 조회한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      await service.getTodayPrices("SMARTPHONE");

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            priceGuides: { some: {} },
            category: { type: "SMARTPHONE" },
          },
        }),
      );
    });

    it("카테고리 필터 없이 전체 조회한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      await service.getTodayPrices();

      const callArg = prisma.deviceModel.findMany.mock.calls[0][0];
      expect(callArg.where.category).toBeUndefined();
    });

    it("여러 카테고리의 모델을 카테고리별로 분리한다", async () => {
      const multiCategoryModels = [
        {
          ...mockModel,
          category: { ...mockCategory, type: "SMARTPHONE" },
          priceGuides: [
            { storage: "128GB", grade: ProductGrade.A, price: 850000 },
          ],
        },
        {
          ...mockModel,
          id: "model-uuid-3",
          name: "iPad Pro",
          category: {
            id: "cat-2",
            type: "TABLET",
            name: "태블릿",
            sortOrder: 2,
          },
          priceGuides: [
            { storage: "256GB", grade: ProductGrade.A, price: 1200000 },
          ],
        },
      ];
      prisma.deviceModel.findMany.mockResolvedValue(multiCategoryModels);

      const result = await service.getTodayPrices();

      expect(result).toHaveLength(2);
      expect(result[0].category.type).toBe("SMARTPHONE");
      expect(result[0].models).toHaveLength(1);
      expect(result[1].category.type).toBe("TABLET");
      expect(result[1].models).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // searchPrices
  // ---------------------------------------------------------------------------
  describe("searchPrices", () => {
    it("키워드로 모델과 가격을 검색한다", async () => {
      const searchResults = [
        {
          ...mockModel,
          priceGuides: [mockPriceGuide],
        },
      ];
      prisma.deviceModel.findMany.mockResolvedValue(searchResults);

      const result = await service.searchPrices("iPhone");

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: "iPhone", mode: "insensitive" } },
            { series: { contains: "iPhone", mode: "insensitive" } },
          ],
          priceGuides: { some: {} },
        },
        include: {
          category: true,
          priceGuides: {
            orderBy: [{ storage: "asc" }, { grade: "asc" }],
          },
        },
        take: 20,
      });
      expect(result).toEqual(searchResults);
    });

    it("검색 결과가 없으면 빈 배열을 반환한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      const result = await service.searchPrices("존재하지않는모델");

      expect(result).toEqual([]);
    });

    it("시리즈 이름으로도 검색할 수 있다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      await service.searchPrices("Galaxy");

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: "Galaxy", mode: "insensitive" } },
              { series: { contains: "Galaxy", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("결과는 최대 20개로 제한된다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      await service.searchPrices("phone");

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // calculateTrend
  // ---------------------------------------------------------------------------
  describe("calculateTrend", () => {
    it("가격 상승 시 UP 트렌드를 반환한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([
        { price: 900000, recordedAt: new Date("2024-06-07") },
        { price: 870000, recordedAt: new Date("2024-06-01") },
      ]);

      const result = await service.calculateTrend(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
      );

      expect(result).toBe(PriceTrend.UP);
    });

    it("가격 하락 시 DOWN 트렌드를 반환한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([
        { price: 800000, recordedAt: new Date("2024-06-07") },
        { price: 860000, recordedAt: new Date("2024-06-01") },
      ]);

      const result = await service.calculateTrend(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
      );

      expect(result).toBe(PriceTrend.DOWN);
    });

    it("가격 변동이 3% 이내이면 STABLE 트렌드를 반환한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([
        { price: 852000, recordedAt: new Date("2024-06-07") },
        { price: 850000, recordedAt: new Date("2024-06-01") },
      ]);

      const result = await service.calculateTrend(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
      );

      expect(result).toBe(PriceTrend.STABLE);
    });

    it("이력이 2개 미만이면 STABLE 트렌드를 반환한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([
        { price: 850000, recordedAt: new Date("2024-06-07") },
      ]);

      const result = await service.calculateTrend(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
      );

      expect(result).toBe(PriceTrend.STABLE);
    });

    it("이력이 없으면 STABLE 트렌드를 반환한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([]);

      const result = await service.calculateTrend(
        "model-uuid-1",
        "128GB",
        ProductGrade.A,
      );

      expect(result).toBe(PriceTrend.STABLE);
    });

    it("최근 7일 이력을 조회한다", async () => {
      prisma.priceHistory.findMany.mockResolvedValue([]);

      await service.calculateTrend("model-uuid-1", "128GB", ProductGrade.A);

      expect(prisma.priceHistory.findMany).toHaveBeenCalledWith({
        where: {
          modelId: "model-uuid-1",
          storage: "128GB",
          grade: ProductGrade.A,
        },
        orderBy: { recordedAt: "desc" },
        take: 7,
      });
    });
  });
});
