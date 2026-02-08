import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { CmsService } from "./cms.service";
import { CmsContentQueryDto } from "./dto";

describe("CmsService", () => {
  let service: CmsService;
  let prisma: MockPrismaService;

  const tenantId = "default-tenant";

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CmsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CmsService>(CmsService);
    prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("서비스가 정의되어 있는지", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAllContents
  // ---------------------------------------------------------------------------
  describe("findAllContents", () => {
    const mockContents = [
      {
        id: "content-1",
        tenantId,
        type: "NOTICE",
        status: "PUBLISHED",
        title: "서비스 오픈 안내",
        content: "오픈합니다.",
        isPinned: true,
        sortOrder: 0,
        viewCount: 10,
        createdAt: new Date("2024-01-01"),
        author: { id: "admin-1", name: "관리자" },
      },
      {
        id: "content-2",
        tenantId,
        type: "NOTICE",
        status: "PUBLISHED",
        title: "업데이트 안내",
        content: "업데이트됩니다.",
        isPinned: false,
        sortOrder: 1,
        viewCount: 5,
        createdAt: new Date("2024-01-02"),
        author: { id: "admin-1", name: "관리자" },
      },
    ];

    it("게시된 콘텐츠 목록을 반환한다", async () => {
      prisma.content.findMany.mockResolvedValue(mockContents);
      prisma.content.count.mockResolvedValue(2);

      const result = await service.findAllContents(
        tenantId,
        {} as CmsContentQueryDto,
      );

      expect(result).toEqual({
        data: mockContents,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, status: "PUBLISHED" },
        }),
      );
    });

    it("유형 필터를 적용한다", async () => {
      prisma.content.findMany.mockResolvedValue([mockContents[0]]);
      prisma.content.count.mockResolvedValue(1);

      await service.findAllContents(tenantId, { type: "NOTICE" as any });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: "NOTICE" }),
        }),
      );
    });

    it("검색어 필터를 적용한다", async () => {
      prisma.content.findMany.mockResolvedValue([mockContents[0]]);
      prisma.content.count.mockResolvedValue(1);

      await service.findAllContents(tenantId, { search: "오픈" });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "오픈", mode: "insensitive" } },
              { content: { contains: "오픈", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("페이지네이션을 적용한다", async () => {
      prisma.content.findMany.mockResolvedValue([]);
      prisma.content.count.mockResolvedValue(25);

      const result = await service.findAllContents(tenantId, {
        page: 2,
        limit: 10,
      });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it("카테고리 필터를 적용한다", async () => {
      prisma.content.findMany.mockResolvedValue([]);
      prisma.content.count.mockResolvedValue(0);

      await service.findAllContents(tenantId, { category: "buy" });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "buy" }),
        }),
      );
    });

    it("결과가 없으면 빈 배열을 반환한다", async () => {
      prisma.content.findMany.mockResolvedValue([]);
      prisma.content.count.mockResolvedValue(0);

      const result = await service.findAllContents(
        tenantId,
        {} as CmsContentQueryDto,
      );

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOneContent
  // ---------------------------------------------------------------------------
  describe("findOneContent", () => {
    const mockContent = {
      id: "content-1",
      tenantId,
      type: "NOTICE",
      status: "PUBLISHED",
      title: "서비스 오픈 안내",
      content: "오픈합니다.",
      viewCount: 10,
      author: { id: "admin-1", name: "관리자" },
    };

    it("콘텐츠 상세를 반환한다", async () => {
      prisma.content.findUnique.mockResolvedValue(mockContent);
      prisma.content.update.mockResolvedValue({
        ...mockContent,
        viewCount: 11,
      });

      const result = await service.findOneContent("content-1");

      expect(result).toEqual(mockContent);
      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: "content-1" },
        data: { viewCount: { increment: 1 } },
      });
    });

    it("FAQ는 viewCount를 증가시키지 않는다", async () => {
      const faqContent = { ...mockContent, type: "FAQ" };
      prisma.content.findUnique.mockResolvedValue(faqContent);

      await service.findOneContent("content-1");

      expect(prisma.content.update).not.toHaveBeenCalled();
    });

    it("존재하지 않는 콘텐츠이면 NotFoundException", async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(service.findOneContent("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("게시되지 않은 콘텐츠이면 NotFoundException", async () => {
      prisma.content.findUnique.mockResolvedValue({
        ...mockContent,
        status: "DRAFT",
      });

      await expect(service.findOneContent("content-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findFaqs
  // ---------------------------------------------------------------------------
  describe("findFaqs", () => {
    const mockFaqs = [
      {
        id: "faq-1",
        type: "FAQ",
        category: "buy",
        title: "Q1",
        answer: "A1",
        sortOrder: 0,
      },
      {
        id: "faq-2",
        type: "FAQ",
        category: "buy",
        title: "Q2",
        answer: "A2",
        sortOrder: 1,
      },
      {
        id: "faq-3",
        type: "FAQ",
        category: "sell",
        title: "Q3",
        answer: "A3",
        sortOrder: 0,
      },
    ];

    it("전체 FAQ를 반환한다", async () => {
      prisma.content.findMany.mockResolvedValue(mockFaqs);

      const result = await service.findFaqs(tenantId);

      expect(result).toEqual({ data: mockFaqs });
      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, type: "FAQ", status: "PUBLISHED" },
        }),
      );
    });

    it("카테고리 필터를 적용한다", async () => {
      prisma.content.findMany.mockResolvedValue([mockFaqs[0], mockFaqs[1]]);

      await service.findFaqs(tenantId, "buy");

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "buy" }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findBanners
  // ---------------------------------------------------------------------------
  describe("findBanners", () => {
    const mockBanners = [
      {
        id: "banner-1",
        title: "배너1",
        position: "MAIN_TOP",
        isActive: true,
        sortOrder: 0,
      },
      {
        id: "banner-2",
        title: "배너2",
        position: "MAIN_TOP",
        isActive: true,
        sortOrder: 1,
      },
    ];

    it("활성 배너를 반환한다", async () => {
      prisma.banner.findMany.mockResolvedValue(mockBanners);

      const result = await service.findBanners(tenantId, {});

      expect(result).toEqual({ data: mockBanners });
      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, isActive: true }),
        }),
      );
    });

    it("위치 필터를 적용한다", async () => {
      prisma.banner.findMany.mockResolvedValue([mockBanners[0]]);

      await service.findBanners(tenantId, { position: "MAIN_TOP" as any });

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ position: "MAIN_TOP" }),
        }),
      );
    });
  });
});
