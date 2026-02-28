import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  DEVICE_CATEGORIES,
  BRANDS,
  PRODUCT_GRADES,
  STORAGE_OPTIONS,
} from "@phone-marketplace/shared";
import {
  AdminCategoryQueryDto,
  AdminUpdateCategoryDto,
  AdminDeviceModelQueryDto,
  AdminCreateDeviceModelDto,
  AdminUpdateDeviceModelDto,
  AdminModelVariantQueryDto,
  AdminCreateModelVariantDto,
  AdminUpdateModelVariantDto,
} from "./dto";

@Injectable()
export class AdminMetadataService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Enums (읽기 전용)
  // ---------------------------------------------------------------------------

  getEnums() {
    return {
      brands: Object.entries(BRANDS).map(([key, val]) => ({
        key,
        label: val.label,
      })),
      categories: Object.entries(DEVICE_CATEGORIES).map(([key, val]) => ({
        key,
        label: val.label,
        icon: val.icon,
      })),
      grades: Object.entries(PRODUCT_GRADES).map(([key, val]) => ({
        key,
        label: val.label,
        description: val.description,
        color: val.color,
      })),
      storageOptions: STORAGE_OPTIONS.map((s) => s),
    };
  }

  // ---------------------------------------------------------------------------
  // Category
  // ---------------------------------------------------------------------------

  async findAllCategories(query: AdminCategoryQueryDto) {
    const where: Prisma.CategoryWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.prisma.category.findMany({
      where,
      include: { _count: { select: { products: true, models: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async updateCategory(id: string, dto: AdminUpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException("카테고리를 찾을 수 없습니다.");
    }

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.category.update({ where: { id }, data });
  }

  // ---------------------------------------------------------------------------
  // DeviceModel
  // ---------------------------------------------------------------------------

  async findAllDeviceModels(query: AdminDeviceModelQueryDto) {
    const { categoryId, brand, search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DeviceModelWhereInput = {};

    if (categoryId) where.categoryId = categoryId;
    if (brand) where.brand = brand;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [models, total] = await Promise.all([
      this.prisma.deviceModel.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, type: true } },
          _count: { select: { variants: true, products: true } },
        },
        orderBy: [{ brand: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      this.prisma.deviceModel.count({ where }),
    ]);

    return {
      data: models,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createDeviceModel(dto: AdminCreateDeviceModelDto) {
    return this.prisma.deviceModel.create({
      data: {
        categoryId: dto.categoryId,
        brand: dto.brand,
        name: dto.name,
        series: dto.series,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      },
      include: {
        category: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async updateDeviceModel(id: string, dto: AdminUpdateDeviceModelDto) {
    const model = await this.prisma.deviceModel.findUnique({
      where: { id },
    });
    if (!model) {
      throw new NotFoundException("기기모델을 찾을 수 없습니다.");
    }

    const data: Prisma.DeviceModelUpdateInput = {};
    if (dto.brand !== undefined) data.brand = dto.brand;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.series !== undefined) data.series = dto.series;
    if (dto.releaseDate !== undefined)
      data.releaseDate = new Date(dto.releaseDate);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.deviceModel.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async removeDeviceModel(id: string) {
    const model = await this.prisma.deviceModel.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!model) {
      throw new NotFoundException("기기모델을 찾을 수 없습니다.");
    }

    if (model._count.products > 0) {
      await this.prisma.deviceModel.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: "연관 상품이 있어 비활성화 처리되었습니다." };
    }

    await this.prisma.deviceModel.delete({ where: { id } });
    return { message: "기기모델이 삭제되었습니다." };
  }

  // ---------------------------------------------------------------------------
  // ModelVariant
  // ---------------------------------------------------------------------------

  async findAllModelVariants(query: AdminModelVariantQueryDto) {
    const { modelId, storage, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ModelVariantWhereInput = {};

    if (modelId) where.modelId = modelId;
    if (storage) where.storage = storage;

    const [variants, total] = await Promise.all([
      this.prisma.modelVariant.findMany({
        where,
        include: {
          model: {
            select: { id: true, brand: true, name: true },
          },
          _count: { select: { products: true } },
        },
        orderBy: [{ model: { brand: "asc" } }, { storage: "asc" }],
        skip,
        take: limit,
      }),
      this.prisma.modelVariant.count({ where }),
    ]);

    return {
      data: variants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createModelVariant(dto: AdminCreateModelVariantDto) {
    return this.prisma.modelVariant.create({
      data: {
        modelId: dto.modelId,
        storage: dto.storage,
        color: dto.color,
        originalMsrp: dto.originalMsrp,
      },
      include: {
        model: { select: { id: true, brand: true, name: true } },
      },
    });
  }

  async updateModelVariant(id: string, dto: AdminUpdateModelVariantDto) {
    const variant = await this.prisma.modelVariant.findUnique({
      where: { id },
    });
    if (!variant) {
      throw new NotFoundException("모델변형을 찾을 수 없습니다.");
    }

    const data: Prisma.ModelVariantUpdateInput = {};
    if (dto.storage !== undefined) data.storage = dto.storage;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.originalMsrp !== undefined) data.originalMsrp = dto.originalMsrp;

    return this.prisma.modelVariant.update({
      where: { id },
      data,
      include: {
        model: { select: { id: true, brand: true, name: true } },
      },
    });
  }

  async removeModelVariant(id: string) {
    const variant = await this.prisma.modelVariant.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!variant) {
      throw new NotFoundException("모델변형을 찾을 수 없습니다.");
    }

    if (variant._count.products > 0) {
      throw new ConflictException(
        "연관 상품이 있어 삭제할 수 없습니다. 먼저 상품을 이동하거나 삭제하세요.",
      );
    }

    await this.prisma.modelVariant.delete({ where: { id } });
    return { message: "모델변형이 삭제되었습니다." };
  }
}
