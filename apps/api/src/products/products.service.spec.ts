import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { ProductQueryDto } from './dto';

describe('ProductsService', () => {
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

  const tenantId = 'default-tenant';

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    const mockProducts = [
      {
        id: 'product-1',
        categoryId: 'cat-1',
        modelId: 'model-1',
        variantId: 'variant-1',
        grade: 'A',
        status: ProductStatus.AVAILABLE,
        sellingPrice: 500000,
        viewCount: 10,
        rating: 4.5,
        createdAt: new Date('2024-01-01'),
        category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
        model: { id: 'model-1', name: 'iPhone 15', brand: 'APPLE' },
        variant: { id: 'variant-1', storage: '256GB' },
      },
      {
        id: 'product-2',
        categoryId: 'cat-1',
        modelId: 'model-2',
        variantId: 'variant-2',
        grade: 'B',
        status: ProductStatus.AVAILABLE,
        sellingPrice: 300000,
        viewCount: 5,
        rating: 4.0,
        createdAt: new Date('2024-01-02'),
        category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
        model: { id: 'model-2', name: 'Galaxy S24', brand: 'SAMSUNG' },
        variant: { id: 'variant-2', storage: '128GB' },
      },
    ];

    it('should return paginated products with default query', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId, {} as ProductQueryDto);

      expect(result).toEqual({
        data: mockProducts,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, status: ProductStatus.AVAILABLE },
          include: { category: true, model: true, variant: true },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { tenantId, status: ProductStatus.AVAILABLE },
      });
    });

    it('should apply category filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { category: 'SMARTPHONE' as any };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.AVAILABLE,
            category: { type: 'SMARTPHONE' },
          }),
        }),
      );
    });

    it('should apply brand filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { brand: 'APPLE' as any };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.AVAILABLE,
            model: { brand: 'APPLE' },
          }),
        }),
      );
    });

    it('should apply modelId filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { modelId: 'model-1' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.AVAILABLE,
            modelId: 'model-1',
          }),
        }),
      );
    });

    it('should apply grade filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { grade: 'A' as any };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.AVAILABLE,
            grade: 'A',
          }),
        }),
      );
    });

    it('should apply storage filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { storage: '256GB' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.AVAILABLE,
            variant: { storage: '256GB' },
          }),
        }),
      );
    });

    it('should apply minPrice filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { minPrice: 400000 };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            sellingPrice: { gte: 400000 },
          }),
        }),
      );
    });

    it('should apply maxPrice filter', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { maxPrice: 600000 };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            sellingPrice: { lte: 600000 },
          }),
        }),
      );
    });

    it('should apply both minPrice and maxPrice as a price range', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { minPrice: 200000, maxPrice: 600000 };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            sellingPrice: { gte: 200000, lte: 600000 },
          }),
        }),
      );
    });

    it('should apply search filter with OR condition', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = { search: 'iPhone' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: [
              { model: { name: { contains: 'iPhone', mode: 'insensitive' } } },
              { description: { contains: 'iPhone', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should sort by price', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const query: ProductQueryDto = { sortBy: 'price', sortOrder: 'asc' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sellingPrice: 'asc' },
        }),
      );
    });

    it('should sort by rating', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const query: ProductQueryDto = { sortBy: 'rating', sortOrder: 'desc' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
        }),
      );
    });

    it('should sort by viewCount', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const query: ProductQueryDto = { sortBy: 'viewCount', sortOrder: 'desc' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        }),
      );
    });

    it('should default sort by createdAt desc for unknown sortBy', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const query: ProductQueryDto = { sortBy: 'unknown' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[1]]);
      prisma.product.count.mockResolvedValue(25);

      const query: ProductQueryDto = { page: 2, limit: 10 };
      const result = await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it('should calculate totalPages correctly when total is not evenly divisible', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(21);

      const query: ProductQueryDto = { page: 1, limit: 10 };
      const result = await service.findAll(tenantId, query);

      expect(result.meta.totalPages).toBe(3);
    });

    it('should return empty data with zero total', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const result = await service.findAll(tenantId, {} as ProductQueryDto);

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      });
    });

    it('should apply multiple filters simultaneously', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: ProductQueryDto = {
        category: 'SMARTPHONE' as any,
        brand: 'APPLE' as any,
        grade: 'A' as any,
        minPrice: 400000,
        maxPrice: 700000,
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
      };

      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.AVAILABLE,
            category: { type: 'SMARTPHONE' },
            model: { brand: 'APPLE' },
            grade: 'A',
            sellingPrice: { gte: 400000, lte: 700000 },
          }),
          orderBy: { sellingPrice: 'asc' },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should use provided status instead of default', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const query: ProductQueryDto = { status: ProductStatus.SOLD };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: ProductStatus.SOLD,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    const mockProduct = {
      id: 'product-1',
      categoryId: 'cat-1',
      modelId: 'model-1',
      variantId: 'variant-1',
      grade: 'A',
      status: ProductStatus.AVAILABLE,
      sellingPrice: 500000,
      viewCount: 10,
      rating: 4.5,
      createdAt: new Date('2024-01-01'),
      category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
      model: {
        id: 'model-1',
        name: 'iPhone 15',
        brand: 'APPLE',
        variants: [{ id: 'variant-1', storage: '256GB' }],
      },
      variant: { id: 'variant-1', storage: '256GB' },
    };

    it('should return a product and increment viewCount', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        viewCount: 11,
      });

      const result = await service.findOne(tenantId, 'product-1');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: {
          category: true,
          model: { include: { variants: true } },
          variant: true,
        },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(tenantId, 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(tenantId, 'nonexistent-id')).rejects.toThrow(
        '상품을 찾을 수 없습니다.',
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getCategories
  // ---------------------------------------------------------------------------
  describe('getCategories', () => {
    const mockCategories = [
      { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰', isActive: true, sortOrder: 1 },
      { id: 'cat-2', type: 'TABLET', name: '태블릿', isActive: true, sortOrder: 2 },
      { id: 'cat-3', type: 'WATCH', name: '스마트워치', isActive: true, sortOrder: 3 },
    ];

    it('should return active categories sorted by sortOrder', async () => {
      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return empty array when no active categories exist', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getModels
  // ---------------------------------------------------------------------------
  describe('getModels', () => {
    const mockModels = [
      {
        id: 'model-1',
        name: 'iPhone 15',
        brand: 'APPLE',
        isActive: true,
        releaseDate: new Date('2023-09-01'),
        category: { id: 'cat-1', type: 'SMARTPHONE' },
        variants: [{ id: 'variant-1', storage: '256GB' }],
      },
    ];

    it('should return all active models without filters', async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);

      const result = await service.getModels();

      expect(result).toEqual(mockModels);
      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { category: true, variants: true },
        orderBy: { releaseDate: 'desc' },
      });
    });

    it('should filter models by categoryType', async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);

      await service.getModels('SMARTPHONE');

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category: { type: 'SMARTPHONE' },
        },
        include: { category: true, variants: true },
        orderBy: { releaseDate: 'desc' },
      });
    });

    it('should filter models by brand', async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);

      await service.getModels(undefined, 'APPLE');

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          brand: 'APPLE',
        },
        include: { category: true, variants: true },
        orderBy: { releaseDate: 'desc' },
      });
    });

    it('should filter models by both categoryType and brand', async () => {
      prisma.deviceModel.findMany.mockResolvedValue(mockModels);

      await service.getModels('SMARTPHONE', 'APPLE');

      expect(prisma.deviceModel.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          category: { type: 'SMARTPHONE' },
          brand: 'APPLE',
        },
        include: { category: true, variants: true },
        orderBy: { releaseDate: 'desc' },
      });
    });

    it('should return empty array when no models match', async () => {
      prisma.deviceModel.findMany.mockResolvedValue([]);

      const result = await service.getModels('LAPTOP', 'APPLE');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getModelVariants
  // ---------------------------------------------------------------------------
  describe('getModelVariants', () => {
    const mockVariants = [
      { id: 'variant-1', storage: '128GB', color: 'Black' },
      { id: 'variant-2', storage: '256GB', color: 'White' },
    ];

    const mockModel = {
      id: 'model-1',
      name: 'iPhone 15',
      brand: 'APPLE',
      variants: mockVariants,
    };

    it('should return model variants when model exists', async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(mockModel);

      const result = await service.getModelVariants('model-1');

      expect(result).toEqual(mockVariants);
      expect(prisma.deviceModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'model-1' },
        include: { variants: true },
      });
    });

    it('should throw NotFoundException when model does not exist', async () => {
      prisma.deviceModel.findUnique.mockResolvedValue(null);

      await expect(service.getModelVariants('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getModelVariants('nonexistent-id')).rejects.toThrow(
        '모델을 찾을 수 없습니다.',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getSimilarProducts
  // ---------------------------------------------------------------------------
  describe('getSimilarProducts', () => {
    const baseProduct = {
      id: 'product-1',
      categoryId: 'cat-1',
      modelId: 'model-1',
      model: { id: 'model-1', name: 'iPhone 15', brand: 'APPLE' },
    };

    const sameModelProducts = [
      {
        id: 'product-2',
        categoryId: 'cat-1',
        modelId: 'model-1',
        status: ProductStatus.AVAILABLE,
        category: { id: 'cat-1' },
        model: { id: 'model-1' },
        variant: { id: 'variant-2' },
      },
      {
        id: 'product-3',
        categoryId: 'cat-1',
        modelId: 'model-1',
        status: ProductStatus.AVAILABLE,
        category: { id: 'cat-1' },
        model: { id: 'model-1' },
        variant: { id: 'variant-3' },
      },
      {
        id: 'product-4',
        categoryId: 'cat-1',
        modelId: 'model-1',
        status: ProductStatus.AVAILABLE,
        category: { id: 'cat-1' },
        model: { id: 'model-1' },
        variant: { id: 'variant-4' },
      },
      {
        id: 'product-5',
        categoryId: 'cat-1',
        modelId: 'model-1',
        status: ProductStatus.AVAILABLE,
        category: { id: 'cat-1' },
        model: { id: 'model-1' },
        variant: { id: 'variant-5' },
      },
    ];

    const sameCategoryProducts = [
      {
        id: 'product-6',
        categoryId: 'cat-1',
        modelId: 'model-2',
        status: ProductStatus.AVAILABLE,
        category: { id: 'cat-1' },
        model: { id: 'model-2' },
        variant: { id: 'variant-6' },
      },
      {
        id: 'product-7',
        categoryId: 'cat-1',
        modelId: 'model-3',
        status: ProductStatus.AVAILABLE,
        category: { id: 'cat-1' },
        model: { id: 'model-3' },
        variant: { id: 'variant-7' },
      },
    ];

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.getSimilarProducts(tenantId, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getSimilarProducts(tenantId, 'nonexistent-id'),
      ).rejects.toThrow('상품을 찾을 수 없습니다.');
    });

    it('should return same model products when enough are found', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.findMany.mockResolvedValueOnce(sameModelProducts);

      const result = await service.getSimilarProducts(tenantId, 'product-1');

      expect(result).toEqual(sameModelProducts);
      expect(result).toHaveLength(4);

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          modelId: 'model-1',
          id: { not: 'product-1' },
          status: ProductStatus.AVAILABLE,
        },
        include: { category: true, model: true, variant: true },
        take: 4,
      });
    });

    it('should backfill with same category products when not enough same model products', async () => {
      const partialSameModel = sameModelProducts.slice(0, 2);

      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.findMany
        .mockResolvedValueOnce(partialSameModel)
        .mockResolvedValueOnce(sameCategoryProducts);

      const result = await service.getSimilarProducts(tenantId, 'product-1');

      // The service mutates the first findMany result via push, so the
      // returned array contains same-model products followed by backfill.
      expect(result).toHaveLength(4);
      expect(result[0].id).toBe('product-2');
      expect(result[1].id).toBe('product-3');
      expect(result[2].id).toBe('product-6');
      expect(result[3].id).toBe('product-7');

      expect(prisma.product.findMany).toHaveBeenCalledTimes(2);

      // First call: same model
      expect(prisma.product.findMany).toHaveBeenNthCalledWith(1, {
        where: {
          tenantId,
          modelId: 'model-1',
          id: { not: 'product-1' },
          status: ProductStatus.AVAILABLE,
        },
        include: { category: true, model: true, variant: true },
        take: 4,
      });

      // Second call: same category backfill
      expect(prisma.product.findMany).toHaveBeenNthCalledWith(2, {
        where: {
          tenantId,
          categoryId: 'cat-1',
          id: { notIn: ['product-1', 'product-2', 'product-3'] },
          status: ProductStatus.AVAILABLE,
        },
        include: { category: true, model: true, variant: true },
        take: 2,
      });
    });

    it('should not backfill when same model products fill the limit', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.findMany.mockResolvedValueOnce(sameModelProducts);

      await service.getSimilarProducts(tenantId, 'product-1', 4);

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle zero same model products with full backfill', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(sameCategoryProducts);

      const result = await service.getSimilarProducts(tenantId, 'product-1', 4);

      expect(result).toEqual(sameCategoryProducts);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(2);

      expect(prisma.product.findMany).toHaveBeenNthCalledWith(2, {
        where: {
          tenantId,
          categoryId: 'cat-1',
          id: { notIn: ['product-1'] },
          status: ProductStatus.AVAILABLE,
        },
        include: { category: true, model: true, variant: true },
        take: 4,
      });
    });

    it('should respect custom limit parameter', async () => {
      prisma.product.findUnique.mockResolvedValue(baseProduct);
      prisma.product.findMany.mockResolvedValueOnce(
        sameModelProducts.slice(0, 2),
      );

      await service.getSimilarProducts(tenantId, 'product-1', 2);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getPopularProducts
  // ---------------------------------------------------------------------------
  describe('getPopularProducts', () => {
    const mockPopularProducts = [
      {
        id: 'product-1',
        status: ProductStatus.AVAILABLE,
        viewCount: 100,
        category: { id: 'cat-1' },
        model: { id: 'model-1' },
        variant: { id: 'variant-1' },
      },
      {
        id: 'product-2',
        status: ProductStatus.AVAILABLE,
        viewCount: 50,
        category: { id: 'cat-1' },
        model: { id: 'model-2' },
        variant: { id: 'variant-2' },
      },
    ];

    it('should return popular products sorted by viewCount desc with default limit', async () => {
      prisma.product.findMany.mockResolvedValue(mockPopularProducts);

      const result = await service.getPopularProducts(tenantId);

      expect(result).toEqual(mockPopularProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: ProductStatus.AVAILABLE },
        include: { category: true, model: true, variant: true },
        orderBy: { viewCount: 'desc' },
        take: 10,
      });
    });

    it('should respect custom limit parameter', async () => {
      prisma.product.findMany.mockResolvedValue(mockPopularProducts);

      await service.getPopularProducts(tenantId, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should return empty array when no products exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.getPopularProducts(tenantId);

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getNewArrivals
  // ---------------------------------------------------------------------------
  describe('getNewArrivals', () => {
    const mockNewProducts = [
      {
        id: 'product-new-1',
        status: ProductStatus.AVAILABLE,
        createdAt: new Date('2024-06-15'),
        category: { id: 'cat-1' },
        model: { id: 'model-1' },
        variant: { id: 'variant-1' },
      },
      {
        id: 'product-new-2',
        status: ProductStatus.AVAILABLE,
        createdAt: new Date('2024-06-14'),
        category: { id: 'cat-1' },
        model: { id: 'model-2' },
        variant: { id: 'variant-2' },
      },
    ];

    it('should return new arrivals sorted by createdAt desc with default limit', async () => {
      prisma.product.findMany.mockResolvedValue(mockNewProducts);

      const result = await service.getNewArrivals(tenantId);

      expect(result).toEqual(mockNewProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: ProductStatus.AVAILABLE },
        include: { category: true, model: true, variant: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should respect custom limit parameter', async () => {
      prisma.product.findMany.mockResolvedValue(mockNewProducts);

      await service.getNewArrivals(tenantId, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should return empty array when no products exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      const result = await service.getNewArrivals(tenantId);

      expect(result).toEqual([]);
    });
  });
});
