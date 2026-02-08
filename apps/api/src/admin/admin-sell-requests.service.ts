import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma, SellRequestStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminSellRequestQueryDto,
  AdminUpdateSellRequestDto,
  AdminCreateQuoteDto,
} from "./dto";

@Injectable()
export class AdminSellRequestsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: AdminSellRequestQueryDto) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SellRequestWhereInput = { tenantId };

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { modelName: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [sellRequests, total] = await Promise.all([
      this.prisma.sellRequest.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          quotes: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { createdAt: "desc" },
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

  async findOne(id: string) {
    const sellRequest = await this.prisma.sellRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        quotes: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!sellRequest) {
      throw new NotFoundException("판매 접수를 찾을 수 없습니다.");
    }

    return sellRequest;
  }

  async update(id: string, dto: AdminUpdateSellRequestDto) {
    const sellRequest = await this.prisma.sellRequest.findUnique({
      where: { id },
    });

    if (!sellRequest) {
      throw new NotFoundException("판매 접수를 찾을 수 없습니다.");
    }

    const updateData: Prisma.SellRequestUpdateInput = {};

    if (dto.status) updateData.status = dto.status;
    if (dto.finalGrade) updateData.finalGrade = dto.finalGrade;
    if (dto.finalPrice !== undefined) updateData.finalPrice = dto.finalPrice;
    if (dto.inspectionNotes) updateData.inspectionNotes = dto.inspectionNotes;

    if (dto.status === SellRequestStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    return this.prisma.sellRequest.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        quotes: true,
      },
    });
  }

  async createQuote(tenantId: string, id: string, dto: AdminCreateQuoteDto) {
    const sellRequest = await this.prisma.sellRequest.findUnique({
      where: { id },
    });

    if (!sellRequest) {
      throw new NotFoundException("판매 접수를 찾을 수 없습니다.");
    }

    if (
      sellRequest.status !== SellRequestStatus.PENDING &&
      sellRequest.status !== SellRequestStatus.QUOTED
    ) {
      throw new BadRequestException(
        "현재 상태에서는 견적을 생성할 수 없습니다.",
      );
    }

    return this.prisma.executeInTransaction(async (tx) => {
      const quote = await tx.sellQuote.create({
        data: {
          sellRequestId: id,
          price: dto.price,
          tenantId,
          notes: dto.notes,
        },
      });

      // 상태를 QUOTED로 변경
      await tx.sellRequest.update({
        where: { id },
        data: { status: SellRequestStatus.QUOTED },
      });

      return quote;
    });
  }
}
