import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductGrade, PriceTrend } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PriceQueryDto } from './dto';

@Injectable()
export class PricesService {
  constructor(private prisma: PrismaService) {}

  async getPriceGuides(query: PriceQueryDto) {
    const { category, brand, modelId, storage, grade } = query;

    const where: Prisma.PriceGuideWhereInput = {};

    if (modelId) {
      where.modelId = modelId;
    } else if (category || brand) {
      where.model = {};
      if (category) {
        where.model.category = { type: category };
      }
      if (brand) {
        where.model.brand = brand;
      }
    }

    if (storage) {
      where.storage = storage;
    }

    if (grade) {
      where.grade = grade;
    }

    return this.prisma.priceGuide.findMany({
      where,
      include: {
        model: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { model: { name: 'asc' } },
        { storage: 'asc' },
        { grade: 'asc' },
      ],
    });
  }

  async getModelPrices(modelId: string) {
    const model = await this.prisma.deviceModel.findUnique({
      where: { id: modelId },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!model) {
      throw new NotFoundException('모델을 찾을 수 없습니다.');
    }

    const priceGuides = await this.prisma.priceGuide.findMany({
      where: { modelId },
      orderBy: [{ storage: 'asc' }, { grade: 'asc' }],
    });

    // 저장공간별 그룹핑
    const storageOptions = [...new Set(priceGuides.map((p) => p.storage))];
    const pricesByStorage = storageOptions.map((storage) => ({
      storage,
      prices: priceGuides.filter((p) => p.storage === storage),
    }));

    return {
      model,
      pricesByStorage,
    };
  }

  async getPriceHistory(modelId: string, storage: string, grade: ProductGrade, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = await this.prisma.priceHistory.findMany({
      where: {
        modelId,
        storage,
        grade,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: 'asc' },
    });

    return history;
  }

  async getPopularModels(limit = 10) {
    // 가격 정보가 있는 인기 모델 조회
    const models = await this.prisma.deviceModel.findMany({
      where: {
        isActive: true,
        priceGuides: {
          some: {},
        },
      },
      include: {
        category: true,
        priceGuides: {
          where: { grade: ProductGrade.A },
          take: 1,
        },
      },
      orderBy: { releaseDate: 'desc' },
      take: limit,
    });

    return models.map((model) => ({
      ...model,
      representativePrice: model.priceGuides[0]?.price || null,
      trend: model.priceGuides[0]?.trend || PriceTrend.STABLE,
    }));
  }

  async getTodayPrices(category?: string) {
    const where: Prisma.DeviceModelWhereInput = {
      isActive: true,
      priceGuides: { some: {} },
    };

    if (category) {
      where.category = { type: category as any };
    }

    const models = await this.prisma.deviceModel.findMany({
      where,
      include: {
        category: true,
        priceGuides: {
          where: {
            grade: { in: [ProductGrade.S, ProductGrade.A] },
          },
          orderBy: { storage: 'asc' },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { brand: 'asc' },
        { releaseDate: 'desc' },
      ],
    });

    // 카테고리별 그룹핑
    const groupedByCategory = models.reduce(
      (acc, model) => {
        const categoryType = model.category.type;
        if (!acc[categoryType]) {
          acc[categoryType] = {
            category: model.category,
            models: [],
          };
        }
        acc[categoryType].models.push(model);
        return acc;
      },
      {} as Record<string, any>,
    );

    return Object.values(groupedByCategory);
  }

  async searchPrices(keyword: string) {
    const models = await this.prisma.deviceModel.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { series: { contains: keyword, mode: 'insensitive' } },
        ],
        priceGuides: { some: {} },
      },
      include: {
        category: true,
        priceGuides: {
          orderBy: [{ storage: 'asc' }, { grade: 'asc' }],
        },
      },
      take: 20,
    });

    return models;
  }

  // 가격 트렌드 계산 (관리자/배치용)
  async calculateTrend(modelId: string, storage: string, grade: ProductGrade): Promise<PriceTrend> {
    const history = await this.prisma.priceHistory.findMany({
      where: { modelId, storage, grade },
      orderBy: { recordedAt: 'desc' },
      take: 7, // 최근 7일
    });

    if (history.length < 2) {
      return PriceTrend.STABLE;
    }

    const latestPrice = history[0].price;
    const oldestPrice = history[history.length - 1].price;
    const changePercent = ((latestPrice - oldestPrice) / oldestPrice) * 100;

    if (changePercent > 3) {
      return PriceTrend.UP;
    } else if (changePercent < -3) {
      return PriceTrend.DOWN;
    }

    return PriceTrend.STABLE;
  }
}
