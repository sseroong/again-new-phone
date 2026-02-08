import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CmsContentQueryDto, CmsBannerQueryDto } from "./dto";

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async findAllContents(tenantId: string, query: CmsContentQueryDto) {
    const { type, category, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = {
      tenantId,
      status: "PUBLISHED",
    };

    if (type) where.type = type;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: [
          { isPinned: "desc" },
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data: contents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneContent(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    if (!content) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    if (content.status !== "PUBLISHED") {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    // viewCount 증가 (FAQ 제외)
    if (content.type !== "FAQ") {
      await this.prisma.content.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return content;
  }

  async findFaqs(tenantId: string, category?: string) {
    const where: Prisma.ContentWhereInput = {
      tenantId,
      type: "FAQ",
      status: "PUBLISHED",
    };

    if (category) where.category = category;

    const faqs = await this.prisma.content.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return { data: faqs };
  }

  async findBanners(tenantId: string, query: CmsBannerQueryDto) {
    const { position } = query;
    const now = new Date();

    const where: Prisma.BannerWhereInput = {
      tenantId,
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    };

    if (position) where.position = position;

    const banners = await this.prisma.banner.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return { data: banners };
  }
}
