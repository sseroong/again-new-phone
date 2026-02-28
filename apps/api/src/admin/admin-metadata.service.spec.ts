import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { AdminMetadataService } from "./admin-metadata.service";

describe("AdminMetadataService", () => {
  let service: AdminMetadataService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminMetadataService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminMetadataService>(AdminMetadataService);
    prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("서비스가 정의되어 있는지", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // getEnums
  // ---------------------------------------------------------------------------
  describe("getEnums", () => {
    it("Brand, Category, Grade, Storage 목록을 반환한다", () => {
      const result = service.getEnums();

      expect(result.brands).toBeInstanceOf(Array);
      expect(result.brands.length).toBeGreaterThan(0);
      expect(result.brands[0]).toHaveProperty("key");
      expect(result.brands[0]).toHaveProperty("label");

      expect(result.categories).toBeInstanceOf(Array);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.categories[0]).toHaveProperty("key");
      expect(result.categories[0]).toHaveProperty("label");
      expect(result.categories[0]).toHaveProperty("icon");

      expect(result.grades).toBeInstanceOf(Array);
      expect(result.grades.length).toBeGreaterThan(0);
      expect(result.grades[0]).toHaveProperty("key");
      expect(result.grades[0]).toHaveProperty("label");
      expect(result.grades[0]).toHaveProperty("description");
      expect(result.grades[0]).toHaveProperty("color");

      expect(result.storageOptions).toBeInstanceOf(Array);
      expect(result.storageOptions.length).toBeGreaterThan(0);
    });

    it("APPLE 브랜드가 포함되어 있다", () => {
      const result = service.getEnums();
      const apple = result.brands.find((b) => b.key === "APPLE");
      expect(apple).toBeDefined();
      expect(apple!.label).toBe("애플");
    });

    it("SMARTPHONE 카테고리가 포함되어 있다", () => {
      const result = service.getEnums();
      const smartphone = result.categories.find((c) => c.key === "SMARTPHONE");
      expect(smartphone).toBeDefined();
      expect(smartphone!.label).toBe("스마트폰");
    });
  });

  // ---------------------------------------------------------------------------
  // findAllCategories
  // ---------------------------------------------------------------------------
  describe("findAllCategories", () => {
    const mockCategories = [
      {
        id: "cat-1",
        type: "SMARTPHONE",
        name: "스마트폰",
        icon: "phone",
        sortOrder: 0,
        isActive: true,
        _count: { products: 10, models: 5 },
      },
      {
        id: "cat-2",
        type: "TABLET",
        name: "태블릿",
        icon: "tablet",
        sortOrder: 1,
        isActive: true,
        _count: { products: 3, models: 2 },
      },
    ];

    it("모든 카테고리 목록을 반환한다", async () => {
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAllCategories({});

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { sortOrder: "asc" },
        }),
      );
    });

    it("타입 필터를 적용한다", async () => {
      prisma.category.findMany.mockResolvedValue([mockCategories[0]]);

      await service.findAllCategories({ type: "SMARTPHONE" as any });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "SMARTPHONE" },
        }),
      );
    });

    it("활성 상태 필터를 적용한다", async () => {
      prisma.category.findMany.mockResolvedValue(mockCategories);

      await service.findAllCategories({ isActive: true });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });

    it("_count를 포함한다", async () => {
      prisma.category.findMany.mockResolvedValue(mockCategories);

      await service.findAllCategories({});

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { _count: { select: { products: true, models: true } } },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateCategory
  // ---------------------------------------------------------------------------
  describe("updateCategory", () => {
    const existingCategory = {
      id: "cat-1",
      type: "SMARTPHONE",
      name: "스마트폰",
      sortOrder: 0,
      isActive: true,
    };

    it("카테고리를 수정한다", async () => {
      prisma.category.findUnique.mockResolvedValue(existingCategory);
      prisma.category.update.mockResolvedValue({
        ...existingCategory,
        name: "스마트 폰",
      });

      const result = await service.updateCategory("cat-1", {
        name: "스마트 폰",
      });

      expect(result.name).toBe("스마트 폰");
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: { name: "스마트 폰" },
      });
    });

    it("여러 필드를 동시에 수정한다", async () => {
      prisma.category.findUnique.mockResolvedValue(existingCategory);
      prisma.category.update.mockResolvedValue({
        ...existingCategory,
        description: "스마트폰 카테고리",
        icon: "new-icon",
        sortOrder: 5,
      });

      await service.updateCategory("cat-1", {
        description: "스마트폰 카테고리",
        icon: "new-icon",
        sortOrder: 5,
      });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: {
          description: "스마트폰 카테고리",
          icon: "new-icon",
          sortOrder: 5,
        },
      });
    });

    it("isActive를 토글한다", async () => {
      prisma.category.findUnique.mockResolvedValue(existingCategory);
      prisma.category.update.mockResolvedValue({
        ...existingCategory,
        isActive: false,
      });

      await service.updateCategory("cat-1", { isActive: false });

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        data: { isActive: false },
      });
    });

    it("존재하지 않는 카테고리이면 NotFoundException", async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCategory("nonexistent", { name: "수정" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // findAllDeviceModels
  // ---------------------------------------------------------------------------
  describe("findAllDeviceModels", () => {
    const mockModels = [
      {
        id: "model-1",
        categoryId: "cat-1",
        brand: "APPLE",
        name: "아이폰 15 Pro",
        series: "15 시리즈",
        isActive: true,
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
        _count: { variants: 3, products: 10 },
      },
      {
        id: "model-2",
        categoryId: "cat-1",
        brand: "SAMSUNG",
        name: "갤럭시 S24",
        series: "S24 시리즈",
        isActive: true,
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
        _count: { variants: 2, products: 5 },
      },
    ];

    it("모든 기기모델 목록을 반환한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);
      prisma.deviceModel.count.mockResolvedValue(2);

      const result = await service.findAllDeviceModels({});

      expect(result).toEqual({
        data: mockModels,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it("카테고리 필터를 적용한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);
      prisma.deviceModel.count.mockResolvedValue(2);

      await service.findAllDeviceModels({ categoryId: "cat-1" });

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: "cat-1" }),
        }),
      );
    });

    it("브랜드 필터를 적용한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([mockModels[0]]);
      prisma.deviceModel.count.mockResolvedValue(1);

      await service.findAllDeviceModels({ brand: "APPLE" as any });

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ brand: "APPLE" }),
        }),
      );
    });

    it("검색어 필터를 적용한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([mockModels[0]]);
      prisma.deviceModel.count.mockResolvedValue(1);

      await service.findAllDeviceModels({ search: "아이폰" });

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "아이폰", mode: "insensitive" },
          }),
        }),
      );
    });

    it("활성 상태 필터를 적용한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);
      prisma.deviceModel.count.mockResolvedValue(2);

      await service.findAllDeviceModels({ isActive: true });

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it("페이지네이션을 적용한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);
      prisma.deviceModel.count.mockResolvedValue(50);

      const result = await service.findAllDeviceModels({
        page: 3,
        limit: 10,
      });

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });

    it("결과가 없으면 빈 배열을 반환한다", async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);
      prisma.deviceModel.count.mockResolvedValue(0);

      const result = await service.findAllDeviceModels({});

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createDeviceModel
  // ---------------------------------------------------------------------------
  describe("createDeviceModel", () => {
    const createDto = {
      categoryId: "cat-1",
      brand: "APPLE" as any,
      name: "아이폰 16 Pro",
      series: "16 시리즈",
    };

    it("기기모델을 생성한다", async () => {
      const mockCreated = {
        id: "model-new",
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      };
      prisma.deviceModel.create.mockResolvedValue(mockCreated);

      const result = await service.createDeviceModel(createDto);

      expect(result).toEqual(mockCreated);
      expect(prisma.deviceModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categoryId: "cat-1",
          brand: "APPLE",
          name: "아이폰 16 Pro",
          series: "16 시리즈",
        }),
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it("출시일을 포함하여 생성한다", async () => {
      const dtoWithDate = {
        ...createDto,
        releaseDate: "2024-09-20T00:00:00.000Z",
      };
      prisma.deviceModel.create.mockResolvedValue({
        id: "model-new",
        ...dtoWithDate,
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      });

      await service.createDeviceModel(dtoWithDate);

      expect(prisma.deviceModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          releaseDate: new Date("2024-09-20T00:00:00.000Z"),
        }),
        include: expect.any(Object),
      });
    });

    it("시리즈 없이 생성한다", async () => {
      const minimalDto = {
        categoryId: "cat-1",
        brand: "SAMSUNG" as any,
        name: "갤럭시 Z 플립 6",
      };
      prisma.deviceModel.create.mockResolvedValue({
        id: "model-new",
        ...minimalDto,
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      });

      await service.createDeviceModel(minimalDto);

      expect(prisma.deviceModel.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brand: "SAMSUNG",
          name: "갤럭시 Z 플립 6",
        }),
        include: expect.any(Object),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateDeviceModel
  // ---------------------------------------------------------------------------
  describe("updateDeviceModel", () => {
    const existingModel = {
      id: "model-1",
      categoryId: "cat-1",
      brand: "APPLE",
      name: "아이폰 15 Pro",
      series: "15 시리즈",
      isActive: true,
    };

    it("기기모델을 수정한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(existingModel);
      prisma.deviceModel.update.mockResolvedValue({
        ...existingModel,
        name: "아이폰 15 Pro Max",
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      });

      const result = await service.updateDeviceModel("model-1", {
        name: "아이폰 15 Pro Max",
      });

      expect(result.name).toBe("아이폰 15 Pro Max");
      expect(prisma.deviceModel.update).toHaveBeenCalledWith({
        where: { id: "model-1" },
        data: { name: "아이폰 15 Pro Max" },
        include: {
          category: { select: { id: true, name: true, type: true } },
        },
      });
    });

    it("여러 필드를 동시에 수정한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(existingModel);
      prisma.deviceModel.update.mockResolvedValue({
        ...existingModel,
        brand: "SAMSUNG",
        name: "갤럭시 S24",
        series: "S24 시리즈",
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      });

      await service.updateDeviceModel("model-1", {
        brand: "SAMSUNG" as any,
        name: "갤럭시 S24",
        series: "S24 시리즈",
      });

      expect(prisma.deviceModel.update).toHaveBeenCalledWith({
        where: { id: "model-1" },
        data: { brand: "SAMSUNG", name: "갤럭시 S24", series: "S24 시리즈" },
        include: expect.any(Object),
      });
    });

    it("출시일을 수정한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(existingModel);
      prisma.deviceModel.update.mockResolvedValue({
        ...existingModel,
        releaseDate: new Date("2024-09-20"),
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      });

      await service.updateDeviceModel("model-1", {
        releaseDate: "2024-09-20T00:00:00.000Z",
      });

      expect(prisma.deviceModel.update).toHaveBeenCalledWith({
        where: { id: "model-1" },
        data: { releaseDate: new Date("2024-09-20T00:00:00.000Z") },
        include: expect.any(Object),
      });
    });

    it("isActive를 토글한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(existingModel);
      prisma.deviceModel.update.mockResolvedValue({
        ...existingModel,
        isActive: false,
        category: { id: "cat-1", name: "스마트폰", type: "SMARTPHONE" },
      });

      await service.updateDeviceModel("model-1", { isActive: false });

      expect(prisma.deviceModel.update).toHaveBeenCalledWith({
        where: { id: "model-1" },
        data: { isActive: false },
        include: expect.any(Object),
      });
    });

    it("존재하지 않는 기기모델이면 NotFoundException", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(null);

      await expect(
        service.updateDeviceModel("nonexistent", { name: "수정" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // removeDeviceModel
  // ---------------------------------------------------------------------------
  describe("removeDeviceModel", () => {
    it("연관 상품이 없으면 하드 삭제한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue({
        id: "model-1",
        name: "아이폰 15 Pro",
        _count: { products: 0 },
      });
      prisma.deviceModel.delete.mockResolvedValue({ id: "model-1" });

      const result = await service.removeDeviceModel("model-1");

      expect(result).toEqual({ message: "기기모델이 삭제되었습니다." });
      expect(prisma.deviceModel.delete).toHaveBeenCalledWith({
        where: { id: "model-1" },
      });
    });

    it("연관 상품이 있으면 소프트 삭제(비활성화)한다", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue({
        id: "model-1",
        name: "아이폰 15 Pro",
        _count: { products: 5 },
      });
      prisma.deviceModel.update.mockResolvedValue({
        id: "model-1",
        isActive: false,
      });

      const result = await service.removeDeviceModel("model-1");

      expect(result).toEqual({
        message: "연관 상품이 있어 비활성화 처리되었습니다.",
      });
      expect(prisma.deviceModel.update).toHaveBeenCalledWith({
        where: { id: "model-1" },
        data: { isActive: false },
      });
      expect(prisma.deviceModel.delete).not.toHaveBeenCalled();
    });

    it("존재하지 않는 기기모델이면 NotFoundException", async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(null);

      await expect(service.removeDeviceModel("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAllModelVariants
  // ---------------------------------------------------------------------------
  describe("findAllModelVariants", () => {
    const mockVariants = [
      {
        id: "var-1",
        modelId: "model-1",
        storage: "256GB",
        color: "내추럴 티타늄",
        originalMsrp: 1550000,
        model: { id: "model-1", brand: "APPLE", name: "아이폰 15 Pro" },
        _count: { products: 3 },
      },
      {
        id: "var-2",
        modelId: "model-1",
        storage: "512GB",
        color: "블루 티타늄",
        originalMsrp: 1900000,
        model: { id: "model-1", brand: "APPLE", name: "아이폰 15 Pro" },
        _count: { products: 1 },
      },
    ];

    it("모든 모델변형 목록을 반환한다", async () => {
      prisma.modelVariant.findMany.mockResolvedValue(mockVariants);
      prisma.modelVariant.count.mockResolvedValue(2);

      const result = await service.findAllModelVariants({});

      expect(result).toEqual({
        data: mockVariants,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it("모델 ID 필터를 적용한다", async () => {
      prisma.modelVariant.findMany.mockResolvedValue(mockVariants);
      prisma.modelVariant.count.mockResolvedValue(2);

      await service.findAllModelVariants({ modelId: "model-1" });

      expect(prisma.modelVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ modelId: "model-1" }),
        }),
      );
    });

    it("저장 용량 필터를 적용한다", async () => {
      prisma.modelVariant.findMany.mockResolvedValue([mockVariants[0]]);
      prisma.modelVariant.count.mockResolvedValue(1);

      await service.findAllModelVariants({ storage: "256GB" });

      expect(prisma.modelVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storage: "256GB" }),
        }),
      );
    });

    it("페이지네이션을 적용한다", async () => {
      prisma.modelVariant.findMany.mockResolvedValue([]);
      prisma.modelVariant.count.mockResolvedValue(30);

      const result = await service.findAllModelVariants({
        page: 2,
        limit: 10,
      });

      expect(prisma.modelVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta).toEqual({
        total: 30,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it("결과가 없으면 빈 배열을 반환한다", async () => {
      prisma.modelVariant.findMany.mockResolvedValue([]);
      prisma.modelVariant.count.mockResolvedValue(0);

      const result = await service.findAllModelVariants({});

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createModelVariant
  // ---------------------------------------------------------------------------
  describe("createModelVariant", () => {
    const createDto = {
      modelId: "model-1",
      storage: "256GB",
      color: "내추럴 티타늄",
      originalMsrp: 1550000,
    };

    it("모델변형을 생성한다", async () => {
      const mockCreated = {
        id: "var-new",
        ...createDto,
        model: { id: "model-1", brand: "APPLE", name: "아이폰 15 Pro" },
      };
      prisma.modelVariant.create.mockResolvedValue(mockCreated);

      const result = await service.createModelVariant(createDto);

      expect(result).toEqual(mockCreated);
      expect(prisma.modelVariant.create).toHaveBeenCalledWith({
        data: {
          modelId: "model-1",
          storage: "256GB",
          color: "내추럴 티타늄",
          originalMsrp: 1550000,
        },
        include: {
          model: { select: { id: true, brand: true, name: true } },
        },
      });
    });

    it("출시가 없이 생성한다", async () => {
      const minimalDto = {
        modelId: "model-1",
        storage: "128GB",
        color: "블랙",
      };
      prisma.modelVariant.create.mockResolvedValue({
        id: "var-new",
        ...minimalDto,
        model: { id: "model-1", brand: "APPLE", name: "아이폰 15 Pro" },
      });

      await service.createModelVariant(minimalDto);

      expect(prisma.modelVariant.create).toHaveBeenCalledWith({
        data: {
          modelId: "model-1",
          storage: "128GB",
          color: "블랙",
          originalMsrp: undefined,
        },
        include: expect.any(Object),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateModelVariant
  // ---------------------------------------------------------------------------
  describe("updateModelVariant", () => {
    const existingVariant = {
      id: "var-1",
      modelId: "model-1",
      storage: "256GB",
      color: "내추럴 티타늄",
      originalMsrp: 1550000,
    };

    it("모델변형을 수정한다", async () => {
      prisma.modelVariant.findUnique.mockResolvedValue(existingVariant);
      prisma.modelVariant.update.mockResolvedValue({
        ...existingVariant,
        color: "블루 티타늄",
        model: { id: "model-1", brand: "APPLE", name: "아이폰 15 Pro" },
      });

      const result = await service.updateModelVariant("var-1", {
        color: "블루 티타늄",
      });

      expect(result.color).toBe("블루 티타늄");
      expect(prisma.modelVariant.update).toHaveBeenCalledWith({
        where: { id: "var-1" },
        data: { color: "블루 티타늄" },
        include: {
          model: { select: { id: true, brand: true, name: true } },
        },
      });
    });

    it("여러 필드를 동시에 수정한다", async () => {
      prisma.modelVariant.findUnique.mockResolvedValue(existingVariant);
      prisma.modelVariant.update.mockResolvedValue({
        ...existingVariant,
        storage: "512GB",
        originalMsrp: 1900000,
        model: { id: "model-1", brand: "APPLE", name: "아이폰 15 Pro" },
      });

      await service.updateModelVariant("var-1", {
        storage: "512GB",
        originalMsrp: 1900000,
      });

      expect(prisma.modelVariant.update).toHaveBeenCalledWith({
        where: { id: "var-1" },
        data: { storage: "512GB", originalMsrp: 1900000 },
        include: expect.any(Object),
      });
    });

    it("존재하지 않는 모델변형이면 NotFoundException", async () => {
      prisma.modelVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.updateModelVariant("nonexistent", { color: "수정" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // removeModelVariant
  // ---------------------------------------------------------------------------
  describe("removeModelVariant", () => {
    it("연관 상품이 없으면 삭제한다", async () => {
      prisma.modelVariant.findUnique.mockResolvedValue({
        id: "var-1",
        storage: "256GB",
        _count: { products: 0 },
      });
      prisma.modelVariant.delete.mockResolvedValue({ id: "var-1" });

      const result = await service.removeModelVariant("var-1");

      expect(result).toEqual({ message: "모델변형이 삭제되었습니다." });
      expect(prisma.modelVariant.delete).toHaveBeenCalledWith({
        where: { id: "var-1" },
      });
    });

    it("연관 상품이 있으면 ConflictException", async () => {
      prisma.modelVariant.findUnique.mockResolvedValue({
        id: "var-1",
        storage: "256GB",
        _count: { products: 3 },
      });

      await expect(service.removeModelVariant("var-1")).rejects.toThrow(
        ConflictException,
      );
    });

    it("존재하지 않는 모델변형이면 NotFoundException", async () => {
      prisma.modelVariant.findUnique.mockResolvedValue(null);

      await expect(service.removeModelVariant("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
