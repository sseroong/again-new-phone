import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { AdminProductsService } from './admin-products.service';
import { ProductGrade, ProductStatus } from '@prisma/client';
import {
  AdminProductQueryDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
} from './dto';

describe('AdminProductsService', () => {
  let service: AdminProductsService;
  let prisma: MockPrismaService;

  const tenantId = 'default-tenant';

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminProductsService>(AdminProductsService);
    prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 서비스 정의
  // ---------------------------------------------------------------------------
  it('서비스가 정의되어 있는지', () => {
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
        grade: ProductGrade.A,
        status: ProductStatus.AVAILABLE,
        sellingPrice: 500000,
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
        grade: ProductGrade.B,
        status: ProductStatus.AVAILABLE,
        sellingPrice: 300000,
        createdAt: new Date('2024-01-02'),
        category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
        model: { id: 'model-2', name: 'Galaxy S24', brand: 'SAMSUNG' },
        variant: { id: 'variant-2', storage: '128GB' },
      },
    ];

    it('전체 상품 목록을 반환한다', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(2);

      const result = await service.findAll(tenantId, {} as AdminProductQueryDto);

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
          where: { tenantId },
          include: { category: true, model: true, variant: true },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith({ where: { tenantId } });
    });

    it('카테고리 필터를 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: AdminProductQueryDto = { category: 'SMARTPHONE' as any };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { type: 'SMARTPHONE' },
          }),
        }),
      );
    });

    it('브랜드 필터를 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: AdminProductQueryDto = { brand: 'APPLE' as any };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            model: { brand: 'APPLE' },
          }),
        }),
      );
    });

    it('검색어 필터를 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: AdminProductQueryDto = { search: 'iPhone' };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                model: {
                  name: { contains: 'iPhone', mode: 'insensitive' },
                },
              },
              {
                description: { contains: 'iPhone', mode: 'insensitive' },
              },
              { imei: { contains: 'iPhone' } },
            ],
          }),
        }),
      );
    });

    it('페이지네이션을 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[1]]);
      prisma.product.count.mockResolvedValue(25);

      const query: AdminProductQueryDto = { page: 2, limit: 10 };
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

    it('등급 필터를 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: AdminProductQueryDto = { grade: ProductGrade.A };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            grade: ProductGrade.A,
          }),
        }),
      );
    });

    it('상태 필터를 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const query: AdminProductQueryDto = { status: ProductStatus.SOLD };
      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ProductStatus.SOLD,
          }),
        }),
      );
    });

    it('결과가 없으면 빈 배열과 메타를 반환한다', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const result = await service.findAll(tenantId, {} as AdminProductQueryDto);

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

    it('totalPages를 올림 처리한다', async () => {
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(21);

      const query: AdminProductQueryDto = { page: 1, limit: 10 };
      const result = await service.findAll(tenantId, query);

      expect(result.meta.totalPages).toBe(3);
    });

    it('여러 필터를 동시에 적용한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]);
      prisma.product.count.mockResolvedValue(1);

      const query: AdminProductQueryDto = {
        category: 'SMARTPHONE' as any,
        brand: 'APPLE' as any,
        grade: ProductGrade.A,
        status: ProductStatus.AVAILABLE,
        search: 'iPhone',
        page: 1,
        limit: 10,
      };

      await service.findAll(tenantId, query);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { type: 'SMARTPHONE' },
            model: { brand: 'APPLE' },
            grade: ProductGrade.A,
            status: ProductStatus.AVAILABLE,
            OR: [
              {
                model: {
                  name: { contains: 'iPhone', mode: 'insensitive' },
                },
              },
              {
                description: { contains: 'iPhone', mode: 'insensitive' },
              },
              { imei: { contains: 'iPhone' } },
            ],
          }),
          skip: 0,
          take: 10,
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
      grade: ProductGrade.A,
      status: ProductStatus.AVAILABLE,
      sellingPrice: 500000,
      createdAt: new Date('2024-01-01'),
      category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
      model: { id: 'model-1', name: 'iPhone 15', brand: 'APPLE' },
      variant: { id: 'variant-1', storage: '256GB' },
      orderItems: [],
    };

    it('상품 상세를 반환한다', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-1');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: {
          category: true,
          model: true,
          variant: true,
          orderItems: {
            include: {
              order: {
                select: { id: true, orderNumber: true, status: true },
              },
            },
          },
        },
      });
    });

    it('상품이 없으면 NotFoundException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        '상품을 찾을 수 없습니다.',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const createDto: AdminCreateProductDto = {
      categoryId: 'cat-1',
      modelId: 'model-1',
      variantId: 'variant-1',
      grade: ProductGrade.A,
      sellingPrice: 500000,
      batteryHealth: 95,
      imei: '123456789012345',
      serialNumber: 'SN123',
      description: '상태 좋은 아이폰',
      images: ['image1.jpg', 'image2.jpg'],
      discountRate: 10,
    };

    const mockCreatedProduct = {
      id: 'new-product-1',
      ...createDto,
      status: ProductStatus.AVAILABLE,
      createdAt: new Date('2024-01-01'),
      category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
      model: { id: 'model-1', name: 'iPhone 15', brand: 'APPLE' },
      variant: { id: 'variant-1', storage: '256GB' },
    };

    it('새 상품을 생성한다', async () => {
      prisma.product.create.mockResolvedValue(mockCreatedProduct);

      const result = await service.create(tenantId, createDto);

      expect(result).toEqual(mockCreatedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          categoryId: createDto.categoryId,
          tenantId,
          modelId: createDto.modelId,
          variantId: createDto.variantId,
          grade: createDto.grade,
          sellingPrice: createDto.sellingPrice,
          batteryHealth: createDto.batteryHealth,
          imei: createDto.imei,
          serialNumber: createDto.serialNumber,
          description: createDto.description,
          images: createDto.images,
          discountRate: createDto.discountRate,
        },
        include: {
          category: true,
          model: true,
          variant: true,
        },
      });
    });

    it('images가 없으면 빈 배열로 생성한다', async () => {
      const dtoWithoutImages: AdminCreateProductDto = {
        categoryId: 'cat-1',
        modelId: 'model-1',
        variantId: 'variant-1',
        grade: ProductGrade.A,
        sellingPrice: 500000,
      };

      prisma.product.create.mockResolvedValue({
        ...mockCreatedProduct,
        images: [],
      });

      await service.create(tenantId, dtoWithoutImages);

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            images: [],
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const existingProduct = {
      id: 'product-1',
      categoryId: 'cat-1',
      modelId: 'model-1',
      variantId: 'variant-1',
      grade: ProductGrade.A,
      status: ProductStatus.AVAILABLE,
      sellingPrice: 500000,
    };

    const updateDto: AdminUpdateProductDto = {
      sellingPrice: 450000,
      description: '가격 인하',
    };

    const mockUpdatedProduct = {
      ...existingProduct,
      ...updateDto,
      category: { id: 'cat-1', type: 'SMARTPHONE', name: '스마트폰' },
      model: { id: 'model-1', name: 'iPhone 15', brand: 'APPLE' },
      variant: { id: 'variant-1', storage: '256GB' },
    };

    it('상품을 수정한다', async () => {
      prisma.product.findUnique.mockResolvedValue(existingProduct);
      prisma.product.update.mockResolvedValue(mockUpdatedProduct);

      const result = await service.update('product-1', updateDto);

      expect(result).toEqual(mockUpdatedProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: updateDto,
        include: {
          category: true,
          model: true,
          variant: true,
        },
      });
    });

    it('존재하지 않는 상품이면 NotFoundException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('nonexistent-id', updateDto),
      ).rejects.toThrow('상품을 찾을 수 없습니다.');

      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // remove
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    const existingProduct = {
      id: 'product-1',
      categoryId: 'cat-1',
      modelId: 'model-1',
      variantId: 'variant-1',
      grade: ProductGrade.A,
      status: ProductStatus.AVAILABLE,
      sellingPrice: 500000,
    };

    it('상품을 비활성화한다', async () => {
      prisma.product.findUnique.mockResolvedValue(existingProduct);
      prisma.product.update.mockResolvedValue({
        ...existingProduct,
        status: 'UNAVAILABLE',
      });

      const result = await service.remove('product-1');

      expect(result).toEqual({ message: '상품이 비활성화되었습니다.' });
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { status: 'UNAVAILABLE' },
      });
    });

    it('존재하지 않는 상품이면 NotFoundException', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        '상품을 찾을 수 없습니다.',
      );

      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });
});
