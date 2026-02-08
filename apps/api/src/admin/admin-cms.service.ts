import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminCmsContentQueryDto,
  AdminCreateContentDto,
  AdminUpdateContentDto,
  AdminCmsBannerQueryDto,
  AdminCreateBannerDto,
  AdminUpdateBannerDto,
} from "./dto";

@Injectable()
export class AdminCmsService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------

  async findAllContents(tenantId: string, query: AdminCmsContentQueryDto) {
    const { type, status, category, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = { tenantId };

    if (type) where.type = type;
    if (status) where.status = status;
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

    return content;
  }

  async createContent(
    tenantId: string,
    authorId: string,
    dto: AdminCreateContentDto,
  ) {
    return this.prisma.content.create({
      data: {
        tenantId,
        authorId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        answer: dto.answer,
        category: dto.category,
        thumbnail: dto.thumbnail,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        sortOrder: dto.sortOrder ?? 0,
        isPinned: dto.isPinned ?? false,
        status: dto.status ?? "DRAFT",
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async updateContent(id: string, dto: AdminUpdateContentDto) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    const data: Prisma.ContentUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.answer !== undefined) data.answer = dto.answer;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.thumbnail !== undefined) data.thumbnail = dto.thumbnail;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.isPinned !== undefined) data.isPinned = dto.isPinned;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.content.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async removeContent(id: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw new NotFoundException("콘텐츠를 찾을 수 없습니다.");
    }

    await this.prisma.content.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return { message: "콘텐츠가 보관 처리되었습니다." };
  }

  // ---------------------------------------------------------------------------
  // Banner
  // ---------------------------------------------------------------------------

  async findAllBanners(tenantId: string, query: AdminCmsBannerQueryDto) {
    const { position, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BannerWhereInput = { tenantId };

    if (position) where.position = position;
    if (isActive !== undefined) where.isActive = isActive;

    const [banners, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.banner.count({ where }),
    ]);

    return {
      data: banners,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException("배너를 찾을 수 없습니다.");
    }
    return banner;
  }

  async createBanner(tenantId: string, dto: AdminCreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        tenantId,
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        position: dto.position ?? "MAIN_TOP",
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async updateBanner(id: string, dto: AdminUpdateBannerDto) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException("배너를 찾을 수 없습니다.");
    }

    const data: Prisma.BannerUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) data.linkUrl = dto.linkUrl;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    return this.prisma.banner.update({
      where: { id },
      data,
    });
  }

  async removeBanner(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException("배너를 찾을 수 없습니다.");
    }

    await this.prisma.banner.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "배너가 비활성화되었습니다." };
  }
}
