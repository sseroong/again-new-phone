import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ReviewType, OrderStatus, SellRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, ReviewQueryDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateReviewDto) {
    // 리뷰 유형에 따른 검증
    if (dto.type === ReviewType.BUY && dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: dto.orderId, userId, status: OrderStatus.COMPLETED },
      });

      if (!order) {
        throw new BadRequestException('완료된 주문만 리뷰를 작성할 수 있습니다.');
      }

      // 이미 리뷰 작성 여부 확인
      const existingReview = await this.prisma.review.findFirst({
        where: { orderId: dto.orderId, userId },
      });

      if (existingReview) {
        throw new BadRequestException('이미 리뷰를 작성하셨습니다.');
      }
    }

    if (dto.type === ReviewType.SELL && dto.sellRequestId) {
      const sellRequest = await this.prisma.sellRequest.findFirst({
        where: {
          id: dto.sellRequestId,
          userId,
          status: SellRequestStatus.COMPLETED,
        },
      });

      if (!sellRequest) {
        throw new BadRequestException('완료된 판매만 리뷰를 작성할 수 있습니다.');
      }

      // 이미 리뷰 작성 여부 확인
      const existingReview = await this.prisma.review.findFirst({
        where: { sellRequestId: dto.sellRequestId, userId },
      });

      if (existingReview) {
        throw new BadRequestException('이미 리뷰를 작성하셨습니다.');
      }
    }

    return this.prisma.review.create({
      data: {
        userId,
        tenantId,
        type: dto.type,
        orderId: dto.orderId,
        sellRequestId: dto.sellRequestId,
        productModel: dto.productModel,
        title: dto.title,
        content: dto.content,
        rating: dto.rating,
        images: dto.images || [],
        quotesReceived: dto.quotesReceived,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, query: ReviewQueryDto) {
    const {
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    const where: Prisma.ReviewWhereInput = {
      tenantId,
      isPublished: true,
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { productModel: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'likes') {
      orderBy.likes = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    return review;
  }

  async findMyReviews(userId: string, query: ReviewQueryDto) {
    const { type, page = 1, limit = 10 } = query;

    const where: Prisma.ReviewWhereInput = { userId };

    if (type) {
      where.type = type;
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async like(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    await this.prisma.review.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });

    return { message: '좋아요가 추가되었습니다.' };
  }

  async delete(userId: string, id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, userId },
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    return { message: '리뷰가 삭제되었습니다.' };
  }

  async getStats(tenantId: string) {
    const [totalReviews, avgRating, sellReviews, buyReviews] = await Promise.all([
      this.prisma.review.count({ where: { tenantId, isPublished: true } }),
      this.prisma.review.aggregate({
        where: { tenantId, isPublished: true },
        _avg: { rating: true },
      }),
      this.prisma.review.count({
        where: { tenantId, isPublished: true, type: ReviewType.SELL },
      }),
      this.prisma.review.count({
        where: { tenantId, isPublished: true, type: ReviewType.BUY },
      }),
    ]);

    return {
      totalReviews,
      avgRating: avgRating._avg.rating || 0,
      sellReviews,
      buyReviews,
    };
  }
}
