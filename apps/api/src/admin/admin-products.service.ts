import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminProductQueryDto,
  AdminCreateProductDto,
  AdminUpdateProductDto,
} from "./dto";

@Injectable()
export class AdminProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: AdminProductQueryDto) {
    const {
      category,
      brand,
      grade,
      status,
      search,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = { tenantId };

    if (category) where.category = { type: category };
    if (brand) where.model = { brand };
    if (grade) where.grade = grade;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { model: { name: { contains: search, mode: "insensitive" } } },
        { description: { contains: search, mode: "insensitive" } },
        { imei: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          model: true,
          variant: true,
        },
        orderBy: { createdAt: "desc" },
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
        model: true,
        variant: true,
        orderItems: {
          include: {
            order: { select: { id: true, orderNumber: true, status: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException("상품을 찾을 수 없습니다.");
    }

    return product;
  }

  async create(tenantId: string, dto: AdminCreateProductDto) {
    return this.prisma.product.create({
      data: {
        tenantId,
        categoryId: dto.categoryId,
        modelId: dto.modelId,
        variantId: dto.variantId,
        grade: dto.grade,
        sellingPrice: dto.sellingPrice,
        batteryHealth: dto.batteryHealth,
        imei: dto.imei,
        serialNumber: dto.serialNumber,
        description: dto.description,
        images: dto.images || [],
        discountRate: dto.discountRate,
      },
      include: {
        category: true,
        model: true,
        variant: true,
      },
    });
  }

  async update(id: string, dto: AdminUpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException("상품을 찾을 수 없습니다.");
    }

    // 관계 필드 변경 시 유효성 검증
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category)
        throw new BadRequestException("유효하지 않은 카테고리입니다.");
    }
    if (dto.modelId) {
      const model = await this.prisma.deviceModel.findUnique({
        where: { id: dto.modelId },
      });
      if (!model) throw new BadRequestException("유효하지 않은 모델입니다.");
    }
    if (dto.variantId) {
      const variant = await this.prisma.modelVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant) throw new BadRequestException("유효하지 않은 옵션입니다.");
    }

    // 날짜 필드 변환
    const updateData: any = { ...dto };
    if (dto.warrantyExpiry) {
      updateData.warrantyExpiry = new Date(dto.warrantyExpiry);
    }
    if (dto.manufactureDate) {
      updateData.manufactureDate = new Date(dto.manufactureDate);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        model: true,
        variant: true,
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException("상품을 찾을 수 없습니다.");
    }

    await this.prisma.product.update({
      where: { id },
      data: { status: "UNAVAILABLE" },
    });

    return { message: "상품이 비활성화되었습니다." };
  }
}
