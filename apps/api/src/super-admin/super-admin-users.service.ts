import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminUserQueryDto, AssignUserTenantDto } from './dto';

@Injectable()
export class SuperAdminUsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: SuperAdminUserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.tenantId) {
      where.tenants = {
        some: { tenantId: query.tenantId },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          tenants: {
            include: {
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async assignTenant(userId: string, dto: AssignUserTenantDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('테넌트를 찾을 수 없습니다.');
    }

    try {
      return await this.prisma.userTenant.create({
        data: {
          userId,
          tenantId: dto.tenantId,
          role: dto.role || UserRole.USER,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tenant: { select: { id: true, name: true, slug: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          '이미 해당 테넌트에 할당된 사용자입니다.',
        );
      }
      throw error;
    }
  }

  async removeTenant(userId: string, tenantId: string) {
    const userTenant = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });

    if (!userTenant) {
      throw new NotFoundException(
        '해당 테넌트에 소속되지 않은 사용자입니다.',
      );
    }

    return this.prisma.userTenant.delete({
      where: { userId_tenantId: { userId, tenantId } },
    });
  }
}
