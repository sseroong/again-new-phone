import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { AdminCmsService } from "./admin-cms.service";

describe("AdminCmsService", () => {
  let service: AdminCmsService;
  let prisma: MockPrismaService;

  const tenantId = "default-tenant";
  const authorId = "admin-1";

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCmsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminCmsService>(AdminCmsService);
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
        author: { id: authorId, name: "관리자" },
      },
      {
        id: "content-2",
        tenantId,
        type: "FAQ",
        status: "DRAFT",
        title: "자주 묻는 질문",
        answer: "답변입니다.",
        category: "buy",
        isPinned: false,
        sortOrder: 1,
        viewCount: 0,
        createdAt: new Date("2024-01-02"),
        author: { id: authorId, name: "관리자" },
      },
    ];

    it("모든 콘텐츠 목록을 반환한다", async () => {
      prisma.content.findMany.mockResolvedValue(mockContents);
      prisma.content.count.mockResolvedValue(2);

      const result = await service.findAllContents(tenantId, {});

      expect(result).toEqual({
        data: mockContents,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
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

    it("상태 필터를 적용한다", async () => {
      prisma.content.findMany.mockResolvedValue([mockContents[1]]);
      prisma.content.count.mockResolvedValue(1);

      await service.findAllContents(tenantId, { status: "DRAFT" as any });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "DRAFT" }),
        }),
      );
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
      prisma.content.count.mockResolvedValue(50);

      const result = await service.findAllContents(tenantId, {
        page: 3,
        limit: 10,
      });

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });

    it("고정 콘텐츠를 우선 정렬한다", async () => {
      prisma.content.findMany.mockResolvedValue(mockContents);
      prisma.content.count.mockResolvedValue(2);

      await service.findAllContents(tenantId, {});

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { isPinned: "desc" },
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        }),
      );
    });

    it("결과가 없으면 빈 배열을 반환한다", async () => {
      prisma.content.findMany.mockResolvedValue([]);
      prisma.content.count.mockResolvedValue(0);

      const result = await service.findAllContents(tenantId, {});

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
      author: { id: authorId, name: "관리자" },
    };

    it("콘텐츠 상세를 반환한다", async () => {
      prisma.content.findUnique.mockResolvedValue(mockContent);

      const result = await service.findOneContent("content-1");

      expect(result).toEqual(mockContent);
      expect(prisma.content.findUnique).toHaveBeenCalledWith({
        where: { id: "content-1" },
        include: {
          author: { select: { id: true, name: true } },
        },
      });
    });

    it("존재하지 않는 콘텐츠이면 NotFoundException", async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(service.findOneContent("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // createContent
  // ---------------------------------------------------------------------------
  describe("createContent", () => {
    const createDto = {
      type: "NOTICE" as any,
      title: "새 공지사항",
      content: "공지사항 내용입니다.",
      status: "DRAFT" as any,
    };

    const mockCreated = {
      id: "content-new",
      tenantId,
      authorId,
      ...createDto,
      sortOrder: 0,
      isPinned: false,
      viewCount: 0,
      createdAt: new Date(),
      author: { id: authorId, name: "관리자" },
    };

    it("콘텐츠를 생성한다", async () => {
      prisma.content.create.mockResolvedValue(mockCreated);

      const result = await service.createContent(tenantId, authorId, createDto);

      expect(result).toEqual(mockCreated);
      expect(prisma.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          authorId,
          type: "NOTICE",
          title: "새 공지사항",
          content: "공지사항 내용입니다.",
          status: "DRAFT",
        }),
        include: {
          author: { select: { id: true, name: true } },
        },
      });
    });

    it("기본값이 적용된다 (sortOrder, isPinned, status)", async () => {
      const minimalDto = { type: "FAQ" as any, title: "질문" };
      prisma.content.create.mockResolvedValue({ id: "new", ...minimalDto });

      await service.createContent(tenantId, authorId, minimalDto);

      expect(prisma.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sortOrder: 0,
          isPinned: false,
          status: "DRAFT",
        }),
        include: expect.any(Object),
      });
    });

    it("FAQ를 생성한다 (answer, category 포함)", async () => {
      const faqDto = {
        type: "FAQ" as any,
        title: "자주 묻는 질문",
        answer: "답변입니다.",
        category: "buy",
      };
      prisma.content.create.mockResolvedValue({
        id: "faq-new",
        ...faqDto,
        author: { id: authorId, name: "관리자" },
      });

      await service.createContent(tenantId, authorId, faqDto);

      expect(prisma.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          answer: "답변입니다.",
          category: "buy",
        }),
        include: expect.any(Object),
      });
    });

    it("이벤트를 생성한다 (startDate, endDate, thumbnail 포함)", async () => {
      const eventDto = {
        type: "EVENT" as any,
        title: "이벤트",
        content: "이벤트 내용",
        thumbnail: "https://example.com/thumb.jpg",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-02-01T00:00:00.000Z",
      };
      prisma.content.create.mockResolvedValue({
        id: "event-new",
        ...eventDto,
        author: { id: authorId, name: "관리자" },
      });

      await service.createContent(tenantId, authorId, eventDto);

      expect(prisma.content.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          thumbnail: "https://example.com/thumb.jpg",
          startDate: new Date("2024-01-01T00:00:00.000Z"),
          endDate: new Date("2024-02-01T00:00:00.000Z"),
        }),
        include: expect.any(Object),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateContent
  // ---------------------------------------------------------------------------
  describe("updateContent", () => {
    const existingContent = {
      id: "content-1",
      tenantId,
      type: "NOTICE",
      status: "DRAFT",
      title: "기존 제목",
      content: "기존 내용",
    };

    it("콘텐츠를 수정한다", async () => {
      prisma.content.findUnique.mockResolvedValue(existingContent);
      prisma.content.update.mockResolvedValue({
        ...existingContent,
        title: "수정된 제목",
        author: { id: authorId, name: "관리자" },
      });

      const result = await service.updateContent("content-1", {
        title: "수정된 제목",
      });

      expect(result.title).toBe("수정된 제목");
      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: "content-1" },
        data: { title: "수정된 제목" },
        include: {
          author: { select: { id: true, name: true } },
        },
      });
    });

    it("상태를 변경한다", async () => {
      prisma.content.findUnique.mockResolvedValue(existingContent);
      prisma.content.update.mockResolvedValue({
        ...existingContent,
        status: "PUBLISHED",
        author: { id: authorId, name: "관리자" },
      });

      await service.updateContent("content-1", { status: "PUBLISHED" as any });

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: "content-1" },
        data: { status: "PUBLISHED" },
        include: expect.any(Object),
      });
    });

    it("여러 필드를 동시에 수정한다", async () => {
      prisma.content.findUnique.mockResolvedValue(existingContent);
      prisma.content.update.mockResolvedValue({
        ...existingContent,
        title: "새 제목",
        isPinned: true,
        sortOrder: 1,
        author: { id: authorId, name: "관리자" },
      });

      await service.updateContent("content-1", {
        title: "새 제목",
        isPinned: true,
        sortOrder: 1,
      });

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: "content-1" },
        data: { title: "새 제목", isPinned: true, sortOrder: 1 },
        include: expect.any(Object),
      });
    });

    it("날짜를 수정한다", async () => {
      prisma.content.findUnique.mockResolvedValue(existingContent);
      prisma.content.update.mockResolvedValue({
        ...existingContent,
        startDate: new Date("2024-03-01"),
        author: { id: authorId, name: "관리자" },
      });

      await service.updateContent("content-1", {
        startDate: "2024-03-01T00:00:00.000Z",
      });

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: "content-1" },
        data: { startDate: new Date("2024-03-01T00:00:00.000Z") },
        include: expect.any(Object),
      });
    });

    it("존재하지 않는 콘텐츠이면 NotFoundException", async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(
        service.updateContent("nonexistent", { title: "수정" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // removeContent
  // ---------------------------------------------------------------------------
  describe("removeContent", () => {
    it("콘텐츠를 보관 처리한다", async () => {
      prisma.content.findUnique.mockResolvedValue({
        id: "content-1",
        status: "PUBLISHED",
      });
      prisma.content.update.mockResolvedValue({
        id: "content-1",
        status: "ARCHIVED",
      });

      const result = await service.removeContent("content-1");

      expect(result).toEqual({ message: "콘텐츠가 보관 처리되었습니다." });
      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: "content-1" },
        data: { status: "ARCHIVED" },
      });
    });

    it("존재하지 않는 콘텐츠이면 NotFoundException", async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(service.removeContent("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAllBanners
  // ---------------------------------------------------------------------------
  describe("findAllBanners", () => {
    const mockBanners = [
      {
        id: "banner-1",
        tenantId,
        title: "메인 배너",
        imageUrl: "https://example.com/banner1.jpg",
        linkUrl: "/events/1",
        position: "MAIN_TOP",
        isActive: true,
        sortOrder: 0,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "banner-2",
        tenantId,
        title: "서브 배너",
        imageUrl: "https://example.com/banner2.jpg",
        position: "MAIN_MIDDLE",
        isActive: false,
        sortOrder: 1,
        createdAt: new Date("2024-01-02"),
      },
    ];

    it("모든 배너 목록을 반환한다", async () => {
      prisma.banner.findMany.mockResolvedValue(mockBanners);
      prisma.banner.count.mockResolvedValue(2);

      const result = await service.findAllBanners(tenantId, {});

      expect(result).toEqual({
        data: mockBanners,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it("위치 필터를 적용한다", async () => {
      prisma.banner.findMany.mockResolvedValue([mockBanners[0]]);
      prisma.banner.count.mockResolvedValue(1);

      await service.findAllBanners(tenantId, { position: "MAIN_TOP" as any });

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ position: "MAIN_TOP" }),
        }),
      );
    });

    it("활성 상태 필터를 적용한다", async () => {
      prisma.banner.findMany.mockResolvedValue([mockBanners[0]]);
      prisma.banner.count.mockResolvedValue(1);

      await service.findAllBanners(tenantId, { isActive: true });

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it("페이지네이션을 적용한다", async () => {
      prisma.banner.findMany.mockResolvedValue([]);
      prisma.banner.count.mockResolvedValue(30);

      const result = await service.findAllBanners(tenantId, {
        page: 2,
        limit: 10,
      });

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta).toEqual({
        total: 30,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findOneBanner
  // ---------------------------------------------------------------------------
  describe("findOneBanner", () => {
    it("배너 상세를 반환한다", async () => {
      const mockBanner = {
        id: "banner-1",
        title: "메인 배너",
        imageUrl: "https://example.com/banner.jpg",
        isActive: true,
      };
      prisma.banner.findUnique.mockResolvedValue(mockBanner);

      const result = await service.findOneBanner("banner-1");

      expect(result).toEqual(mockBanner);
    });

    it("존재하지 않는 배너이면 NotFoundException", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.findOneBanner("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // createBanner
  // ---------------------------------------------------------------------------
  describe("createBanner", () => {
    const createDto = {
      title: "새 배너",
      imageUrl: "https://example.com/new-banner.jpg",
      linkUrl: "/events/new",
    };

    it("배너를 생성한다", async () => {
      const mockCreated = {
        id: "banner-new",
        tenantId,
        ...createDto,
        position: "MAIN_TOP",
        isActive: true,
        sortOrder: 0,
      };
      prisma.banner.create.mockResolvedValue(mockCreated);

      const result = await service.createBanner(tenantId, createDto);

      expect(result).toEqual(mockCreated);
      expect(prisma.banner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          title: "새 배너",
          imageUrl: "https://example.com/new-banner.jpg",
          linkUrl: "/events/new",
          position: "MAIN_TOP",
          isActive: true,
          sortOrder: 0,
        }),
      });
    });

    it("기본값이 적용된다 (position, isActive, sortOrder)", async () => {
      const minimalDto = {
        title: "배너",
        imageUrl: "https://example.com/img.jpg",
      };
      prisma.banner.create.mockResolvedValue({ id: "new", ...minimalDto });

      await service.createBanner(tenantId, minimalDto);

      expect(prisma.banner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          position: "MAIN_TOP",
          isActive: true,
          sortOrder: 0,
        }),
      });
    });

    it("날짜를 포함하여 생성한다", async () => {
      const dtoWithDates = {
        ...createDto,
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-12-31T00:00:00.000Z",
      };
      prisma.banner.create.mockResolvedValue({ id: "new", ...dtoWithDates });

      await service.createBanner(tenantId, dtoWithDates);

      expect(prisma.banner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startDate: new Date("2024-01-01T00:00:00.000Z"),
          endDate: new Date("2024-12-31T00:00:00.000Z"),
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateBanner
  // ---------------------------------------------------------------------------
  describe("updateBanner", () => {
    const existingBanner = {
      id: "banner-1",
      tenantId,
      title: "기존 배너",
      imageUrl: "https://example.com/old.jpg",
      isActive: true,
    };

    it("배너를 수정한다", async () => {
      prisma.banner.findUnique.mockResolvedValue(existingBanner);
      prisma.banner.update.mockResolvedValue({
        ...existingBanner,
        title: "수정된 배너",
      });

      const result = await service.updateBanner("banner-1", {
        title: "수정된 배너",
      });

      expect(result.title).toBe("수정된 배너");
      expect(prisma.banner.update).toHaveBeenCalledWith({
        where: { id: "banner-1" },
        data: { title: "수정된 배너" },
      });
    });

    it("여러 필드를 동시에 수정한다", async () => {
      prisma.banner.findUnique.mockResolvedValue(existingBanner);
      prisma.banner.update.mockResolvedValue({
        ...existingBanner,
        title: "새 배너",
        isActive: false,
        sortOrder: 5,
      });

      await service.updateBanner("banner-1", {
        title: "새 배너",
        isActive: false,
        sortOrder: 5,
      });

      expect(prisma.banner.update).toHaveBeenCalledWith({
        where: { id: "banner-1" },
        data: { title: "새 배너", isActive: false, sortOrder: 5 },
      });
    });

    it("위치를 변경한다", async () => {
      prisma.banner.findUnique.mockResolvedValue(existingBanner);
      prisma.banner.update.mockResolvedValue({
        ...existingBanner,
        position: "MAIN_MIDDLE",
      });

      await service.updateBanner("banner-1", {
        position: "MAIN_MIDDLE" as any,
      });

      expect(prisma.banner.update).toHaveBeenCalledWith({
        where: { id: "banner-1" },
        data: { position: "MAIN_MIDDLE" },
      });
    });

    it("존재하지 않는 배너이면 NotFoundException", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(
        service.updateBanner("nonexistent", { title: "수정" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // removeBanner
  // ---------------------------------------------------------------------------
  describe("removeBanner", () => {
    it("배너를 비활성화한다", async () => {
      prisma.banner.findUnique.mockResolvedValue({
        id: "banner-1",
        isActive: true,
      });
      prisma.banner.update.mockResolvedValue({
        id: "banner-1",
        isActive: false,
      });

      const result = await service.removeBanner("banner-1");

      expect(result).toEqual({ message: "배너가 비활성화되었습니다." });
      expect(prisma.banner.update).toHaveBeenCalledWith({
        where: { id: "banner-1" },
        data: { isActive: false },
      });
    });

    it("존재하지 않는 배너이면 NotFoundException", async () => {
      prisma.banner.findUnique.mockResolvedValue(null);

      await expect(service.removeBanner("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
