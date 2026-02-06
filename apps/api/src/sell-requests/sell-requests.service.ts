import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, SellRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSellRequestDto,
  SellRequestQueryDto,
  UpdateSellRequestDto,
} from './dto';

@Injectable()
export class SellRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSellRequestDto) {
    return this.prisma.sellRequest.create({
      data: {
        userId,
        category: dto.category,
        brand: dto.brand,
        modelName: dto.modelName,
        storage: dto.storage,
        color: dto.color,
        selfGrade: dto.selfGrade,
        estimatedPrice: dto.estimatedPrice,
        tradeMethod: dto.tradeMethod,
        deviceCondition: dto.deviceCondition as any,
      },
    });
  }

  async findAll(userId: string, query: SellRequestQueryDto) {
    const { status, page = 1, limit = 10 } = query;

    const where: Prisma.SellRequestWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [sellRequests, total] = await Promise.all([
      this.prisma.sellRequest.findMany({
        where,
        include: {
          quotes: {
            orderBy: { price: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sellRequest.count({ where }),
    ]);

    return {
      data: sellRequests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const sellRequest = await this.prisma.sellRequest.findFirst({
      where: { id, userId },
      include: {
        quotes: {
          orderBy: { price: 'desc' },
        },
      },
    });

    if (!sellRequest) {
      throw new NotFoundException('판매 접수를 찾을 수 없습니다.');
    }

    return sellRequest;
  }

  async update(userId: string, id: string, dto: UpdateSellRequestDto) {
    const sellRequest = await this.prisma.sellRequest.findFirst({
      where: { id, userId },
    });

    if (!sellRequest) {
      throw new NotFoundException('판매 접수를 찾을 수 없습니다.');
    }

    // 진행 중인 상태에서만 수정 가능
    if (
      sellRequest.status !== SellRequestStatus.PENDING &&
      sellRequest.status !== SellRequestStatus.QUOTED
    ) {
      throw new BadRequestException('현재 상태에서는 수정할 수 없습니다.');
    }

    return this.prisma.sellRequest.update({
      where: { id },
      data: dto,
    });
  }

  async cancel(userId: string, id: string) {
    const sellRequest = await this.prisma.sellRequest.findFirst({
      where: { id, userId },
    });

    if (!sellRequest) {
      throw new NotFoundException('판매 접수를 찾을 수 없습니다.');
    }

    // 검수 전까지만 취소 가능
    const cancelableStatuses: SellRequestStatus[] = [
      SellRequestStatus.PENDING,
      SellRequestStatus.QUOTED,
      SellRequestStatus.ACCEPTED,
    ];

    if (!cancelableStatuses.includes(sellRequest.status)) {
      throw new BadRequestException('현재 상태에서는 취소할 수 없습니다.');
    }

    await this.prisma.sellRequest.update({
      where: { id },
      data: { status: SellRequestStatus.CANCELLED },
    });

    return { message: '판매 접수가 취소되었습니다.' };
  }

  async acceptQuote(userId: string, id: string, quoteId: string) {
    const sellRequest = await this.prisma.sellRequest.findFirst({
      where: { id, userId },
      include: { quotes: true },
    });

    if (!sellRequest) {
      throw new NotFoundException('판매 접수를 찾을 수 없습니다.');
    }

    if (sellRequest.status !== SellRequestStatus.QUOTED) {
      throw new BadRequestException('견적 수락 가능한 상태가 아닙니다.');
    }

    const quote = sellRequest.quotes.find((q) => q.id === quoteId);

    if (!quote) {
      throw new NotFoundException('견적을 찾을 수 없습니다.');
    }

    await this.prisma.executeInTransaction(async (tx) => {
      // 견적 수락 처리
      await tx.sellQuote.update({
        where: { id: quoteId },
        data: { isAccepted: true },
      });

      // 판매 접수 상태 변경
      await tx.sellRequest.update({
        where: { id },
        data: {
          status: SellRequestStatus.ACCEPTED,
          finalPrice: quote.price,
        },
      });
    });

    return { message: '견적이 수락되었습니다.' };
  }

  async addTrackingNumber(userId: string, id: string, trackingNumber: string) {
    const sellRequest = await this.prisma.sellRequest.findFirst({
      where: { id, userId },
    });

    if (!sellRequest) {
      throw new NotFoundException('판매 접수를 찾을 수 없습니다.');
    }

    if (sellRequest.status !== SellRequestStatus.ACCEPTED) {
      throw new BadRequestException('송장번호를 등록할 수 없는 상태입니다.');
    }

    return this.prisma.sellRequest.update({
      where: { id },
      data: {
        trackingNumber,
        status: SellRequestStatus.SHIPPING,
      },
    });
  }

  // 시세 조회 (판매 접수 전 참고용)
  async getEstimatedPrice(
    category: string,
    brand: string,
    modelName: string,
    storage: string,
    grade: string,
  ) {
    // 해당 모델의 시세 조회
    const model = await this.prisma.deviceModel.findFirst({
      where: {
        brand: brand as any,
        name: { contains: modelName, mode: 'insensitive' },
      },
    });

    if (!model) {
      return null;
    }

    const priceGuide = await this.prisma.priceGuide.findFirst({
      where: {
        modelId: model.id,
        storage,
        grade: grade as any,
      },
    });

    return priceGuide;
  }
}
