import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const {
      category,
      brand,
      modelId,
      grade,
      status = ProductStatus.AVAILABLE,
      storage,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.ProductWhereInput = {
      status,
    };

    if (category) {
      where.category = { type: category };
    }

    if (brand) {
      where.model = { brand };
    }

    if (modelId) {
      where.modelId = modelId;
    }

    if (grade) {
      where.grade = grade;
    }

    if (storage) {
      where.variant = { storage };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.sellingPrice = {};
      if (minPrice !== undefined) {
        where.sellingPrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.sellingPrice.lte = maxPrice;
      }
    }

    if (search) {
      where.OR = [
        { model: { name: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.sellingPrice = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'viewCount') {
      orderBy.viewCount = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          model: true,
          variant: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        model: {
          include: {
            variants: true,
          },
        },
        variant: true,
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // 조회수 증가
    await this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return product;
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getModels(categoryType?: string, brand?: string) {
    const where: Prisma.DeviceModelWhereInput = {
      isActive: true,
    };

    if (categoryType) {
      where.category = { type: categoryType as any };
    }

    if (brand) {
      where.brand = brand as any;
    }

    return this.prisma.deviceModel.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: { releaseDate: 'desc' },
    });
  }

  async getModelVariants(modelId: string) {
    const model = await this.prisma.deviceModel.findUnique({
      where: { id: modelId },
      include: {
        variants: true,
      },
    });

    if (!model) {
      throw new NotFoundException('모델을 찾을 수 없습니다.');
    }

    return model.variants;
  }

  async getSimilarProducts(productId: string, limit = 4) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { model: true },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // 같은 모델, 다른 상품
    const similarProducts = await this.prisma.product.findMany({
      where: {
        modelId: product.modelId,
        id: { not: productId },
        status: ProductStatus.AVAILABLE,
      },
      include: {
        category: true,
        model: true,
        variant: true,
      },
      take: limit,
    });

    // 부족하면 같은 카테고리에서 추가
    if (similarProducts.length < limit) {
      const additionalProducts = await this.prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { notIn: [productId, ...similarProducts.map((p) => p.id)] },
          status: ProductStatus.AVAILABLE,
        },
        include: {
          category: true,
          model: true,
          variant: true,
        },
        take: limit - similarProducts.length,
      });

      similarProducts.push(...additionalProducts);
    }

    return similarProducts;
  }

  async getPopularProducts(limit = 10) {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.AVAILABLE },
      include: {
        category: true,
        model: true,
        variant: true,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  async getNewArrivals(limit = 10) {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.AVAILABLE },
      include: {
        category: true,
        model: true,
        variant: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
