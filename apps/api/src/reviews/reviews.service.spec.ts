import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ReviewType, OrderStatus, SellRequestStatus } from "@prisma/client";
import { ReviewsService } from "./reviews.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { CreateReviewDto, ReviewQueryDto } from "./dto";

describe("ReviewsService", () => {
  let service: ReviewsService;
  let prisma: MockPrismaService;

  const mockUserId = "user-uuid-1";
  const mockReviewId = "review-uuid-1";
  const tenantId = "default-tenant";

  const mockReview = {
    id: mockReviewId,
    userId: mockUserId,
    type: ReviewType.BUY,
    orderId: "order-uuid-1",
    sellRequestId: null,
    productModel: "iPhone 15 Pro",
    title: "좋은 상품입니다",
    content: "상태가 매우 좋아요",
    rating: 5,
    images: [],
    likes: 0,
    isPublished: true,
    quotesReceived: null,
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
    user: { id: mockUserId, name: "홍길동" },
  };

  const mockSellReview = {
    ...mockReview,
    id: "review-uuid-2",
    type: ReviewType.SELL,
    orderId: null,
    sellRequestId: "sell-request-uuid-1",
    title: "판매 후기",
    content: "빠른 견적 감사합니다",
    quotesReceived: 3,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe("create", () => {
    const buyDto: CreateReviewDto = {
      type: ReviewType.BUY,
      orderId: "order-uuid-1",
      productModel: "iPhone 15 Pro",
      title: "좋은 상품입니다",
      content: "상태가 매우 좋아요",
      rating: 5,
    };

    const sellDto: CreateReviewDto = {
      type: ReviewType.SELL,
      sellRequestId: "sell-request-uuid-1",
      productModel: "Galaxy S24",
      title: "판매 후기",
      content: "빠른 견적 감사합니다",
      rating: 4,
      quotesReceived: 3,
    };

    it("BUY 리뷰를 정상적으로 생성한다", async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: "order-uuid-1",
        userId: mockUserId,
        status: OrderStatus.COMPLETED,
      });
      prisma.review.findFirst.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue(mockReview);

      const result = await service.create(tenantId, mockUserId, buyDto);

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: buyDto.orderId,
          userId: mockUserId,
          status: OrderStatus.COMPLETED,
        },
      });
      expect(prisma.review.findFirst).toHaveBeenCalledWith({
        where: { orderId: buyDto.orderId, userId: mockUserId },
      });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          type: ReviewType.BUY,
          orderId: buyDto.orderId,
          sellRequestId: undefined,
          productModel: buyDto.productModel,
          title: buyDto.title,
          content: buyDto.content,
          rating: buyDto.rating,
          images: [],
          quotesReceived: undefined,
          tenantId: "default-tenant",
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockReview);
    });

    it("미완료 주문에 대한 BUY 리뷰 작성 시 BadRequestException을 던진다", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.create(tenantId, mockUserId, buyDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, mockUserId, buyDto),
      ).rejects.toThrow("완료된 주문만 리뷰를 작성할 수 있습니다.");
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("이미 작성된 BUY 리뷰가 있으면 BadRequestException을 던진다", async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: "order-uuid-1",
        userId: mockUserId,
        status: OrderStatus.COMPLETED,
      });
      prisma.review.findFirst.mockResolvedValue(mockReview);

      await expect(
        service.create(tenantId, mockUserId, buyDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, mockUserId, buyDto),
      ).rejects.toThrow("이미 리뷰를 작성하셨습니다.");
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("SELL 리뷰를 정상적으로 생성한다", async () => {
      prisma.sellRequest.findFirst.mockResolvedValue({
        id: "sell-request-uuid-1",
        userId: mockUserId,
        status: SellRequestStatus.COMPLETED,
      });
      prisma.review.findFirst.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue(mockSellReview);

      const result = await service.create(tenantId, mockUserId, sellDto);

      expect(prisma.sellRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: sellDto.sellRequestId,
          userId: mockUserId,
          status: SellRequestStatus.COMPLETED,
        },
      });
      expect(prisma.review.findFirst).toHaveBeenCalledWith({
        where: { sellRequestId: sellDto.sellRequestId, userId: mockUserId },
      });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          type: ReviewType.SELL,
          orderId: undefined,
          sellRequestId: sellDto.sellRequestId,
          productModel: sellDto.productModel,
          title: sellDto.title,
          content: sellDto.content,
          rating: sellDto.rating,
          images: [],
          quotesReceived: sellDto.quotesReceived,
          tenantId: "default-tenant",
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockSellReview);
    });

    it("미완료 판매 접수에 대한 SELL 리뷰 작성 시 BadRequestException을 던진다", async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.create(tenantId, mockUserId, sellDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, mockUserId, sellDto),
      ).rejects.toThrow("완료된 판매만 리뷰를 작성할 수 있습니다.");
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("이미 작성된 SELL 리뷰가 있으면 BadRequestException을 던진다", async () => {
      prisma.sellRequest.findFirst.mockResolvedValue({
        id: "sell-request-uuid-1",
        userId: mockUserId,
        status: SellRequestStatus.COMPLETED,
      });
      prisma.review.findFirst.mockResolvedValue(mockSellReview);

      await expect(
        service.create(tenantId, mockUserId, sellDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(tenantId, mockUserId, sellDto),
      ).rejects.toThrow("이미 리뷰를 작성하셨습니다.");
      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("이미지가 포함된 리뷰를 정상적으로 생성한다", async () => {
      const dtoWithImages: CreateReviewDto = {
        ...buyDto,
        images: [
          "https://example.com/img1.jpg",
          "https://example.com/img2.jpg",
        ],
      };
      prisma.order.findFirst.mockResolvedValue({
        id: "order-uuid-1",
        userId: mockUserId,
        status: OrderStatus.COMPLETED,
      });
      prisma.review.findFirst.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue({
        ...mockReview,
        images: dtoWithImages.images,
      });

      await service.create(tenantId, mockUserId, dtoWithImages);

      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            images: dtoWithImages.images,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe("findAll", () => {
    const mockReviews = [mockReview];

    it("기본 조건으로 공개된 리뷰 목록을 조회한다", async () => {
      prisma.review.findMany.mockResolvedValue(mockReviews);
      prisma.review.count.mockResolvedValue(1);

      const query: ReviewQueryDto = {};
      const result = await service.findAll(tenantId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { tenantId, isPublished: true },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { tenantId, isPublished: true },
      });
      expect(result).toEqual({
        data: mockReviews,
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it("검색어로 필터링하여 리뷰를 조회한다", async () => {
      prisma.review.findMany.mockResolvedValue(mockReviews);
      prisma.review.count.mockResolvedValue(1);

      const query: ReviewQueryDto = { search: "iPhone" };
      await service.findAll(tenantId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId,
            isPublished: true,
            OR: [
              { title: { contains: "iPhone", mode: "insensitive" } },
              { content: { contains: "iPhone", mode: "insensitive" } },
              { productModel: { contains: "iPhone", mode: "insensitive" } },
            ],
          },
        }),
      );
    });

    it("타입 필터로 리뷰를 조회한다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(0);

      const query: ReviewQueryDto = { type: ReviewType.SELL };
      await service.findAll(tenantId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, isPublished: true, type: ReviewType.SELL },
        }),
      );
    });

    it("rating 기준으로 정렬할 수 있다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(0);

      const query: ReviewQueryDto = { sortBy: "rating", sortOrder: "asc" };
      await service.findAll(tenantId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: "asc" },
        }),
      );
    });

    it("likes 기준으로 정렬할 수 있다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(0);

      const query: ReviewQueryDto = { sortBy: "likes", sortOrder: "desc" };
      await service.findAll(tenantId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { likes: "desc" },
        }),
      );
    });

    it("페이지네이션이 올바르게 적용된다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(25);

      const query: ReviewQueryDto = { page: 3, limit: 5 };
      const result = await service.findAll(tenantId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
      expect(result.meta).toEqual({
        total: 25,
        page: 3,
        limit: 5,
        totalPages: 5,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe("findOne", () => {
    it("리뷰를 ID로 조회하여 반환한다", async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.findOne(mockReviewId);

      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockReview);
    });

    it("존재하지 않는 리뷰 조회 시 NotFoundException을 던진다", async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        "리뷰를 찾을 수 없습니다.",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findMyReviews
  // ---------------------------------------------------------------------------
  describe("findMyReviews", () => {
    it("사용자의 리뷰 목록을 조회한다", async () => {
      prisma.review.findMany.mockResolvedValue([mockReview]);
      prisma.review.count.mockResolvedValue(1);

      const query: ReviewQueryDto = {};
      const result = await service.findMyReviews(mockUserId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      });
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result).toEqual({
        data: [mockReview],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it("타입 필터를 적용하여 사용자 리뷰를 조회한다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(0);

      const query: ReviewQueryDto = { type: ReviewType.SELL };
      await service.findMyReviews(mockUserId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, type: ReviewType.SELL },
        }),
      );
    });

    it("페이지네이션이 올바르게 적용된다", async () => {
      prisma.review.findMany.mockResolvedValue([]);
      prisma.review.count.mockResolvedValue(15);

      const query: ReviewQueryDto = { page: 2, limit: 5 };
      const result = await service.findMyReviews(mockUserId, query);

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.meta).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // like
  // ---------------------------------------------------------------------------
  describe("like", () => {
    it("리뷰에 좋아요를 추가한다", async () => {
      prisma.review.findUnique.mockResolvedValue(mockReview);
      prisma.review.update.mockResolvedValue({
        ...mockReview,
        likes: 1,
      });

      const result = await service.like(mockReviewId);

      expect(prisma.review.findUnique).toHaveBeenCalledWith({
        where: { id: mockReviewId },
      });
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: { likes: { increment: 1 } },
      });
      expect(result).toEqual({ message: "좋아요가 추가되었습니다." });
    });

    it("존재하지 않는 리뷰에 좋아요 시 NotFoundException을 던진다", async () => {
      prisma.review.findUnique.mockResolvedValue(null);

      await expect(service.like("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.like("nonexistent-id")).rejects.toThrow(
        "리뷰를 찾을 수 없습니다.",
      );
      expect(prisma.review.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe("delete", () => {
    it("자신의 리뷰를 정상적으로 삭제한다", async () => {
      prisma.review.findFirst.mockResolvedValue(mockReview);
      prisma.review.delete.mockResolvedValue(mockReview);

      const result = await service.delete(mockUserId, mockReviewId);

      expect(prisma.review.findFirst).toHaveBeenCalledWith({
        where: { id: mockReviewId, userId: mockUserId },
      });
      expect(prisma.review.delete).toHaveBeenCalledWith({
        where: { id: mockReviewId },
      });
      expect(result).toEqual({ message: "리뷰가 삭제되었습니다." });
    });

    it("타인의 리뷰 삭제 시 NotFoundException을 던진다", async () => {
      prisma.review.findFirst.mockResolvedValue(null);

      await expect(
        service.delete("other-user-id", mockReviewId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.delete("other-user-id", mockReviewId),
      ).rejects.toThrow("리뷰를 찾을 수 없습니다.");
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });

    it("존재하지 않는 리뷰 삭제 시 NotFoundException을 던진다", async () => {
      prisma.review.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(mockUserId, "nonexistent-id"),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.review.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getStats
  // ---------------------------------------------------------------------------
  describe("getStats", () => {
    it("리뷰 통계를 정상적으로 반환한다", async () => {
      prisma.review.count
        .mockResolvedValueOnce(100) // totalReviews
        .mockResolvedValueOnce(40) // sellReviews
        .mockResolvedValueOnce(60); // buyReviews
      prisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
      });

      const result = await service.getStats(tenantId);

      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { tenantId, isPublished: true },
      });
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { tenantId, isPublished: true, type: ReviewType.SELL },
      });
      expect(prisma.review.count).toHaveBeenCalledWith({
        where: { tenantId, isPublished: true, type: ReviewType.BUY },
      });
      expect(prisma.review.aggregate).toHaveBeenCalledWith({
        where: { tenantId, isPublished: true },
        _avg: { rating: true },
      });
      expect(result).toEqual({
        totalReviews: 100,
        avgRating: 4.5,
        sellReviews: 40,
        buyReviews: 60,
      });
    });

    it("리뷰가 없을 때 avgRating이 0으로 반환된다", async () => {
      prisma.review.count
        .mockResolvedValueOnce(0) // totalReviews
        .mockResolvedValueOnce(0) // sellReviews
        .mockResolvedValueOnce(0); // buyReviews
      prisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
      });

      const result = await service.getStats(tenantId);

      expect(result).toEqual({
        totalReviews: 0,
        avgRating: 0,
        sellReviews: 0,
        buyReviews: 0,
      });
    });
  });
});
