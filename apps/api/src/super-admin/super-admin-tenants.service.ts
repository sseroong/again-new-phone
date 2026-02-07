import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TENANT_ID } from '@phone-marketplace/shared';
import { TenantQueryDto, CreateTenantDto, UpdateTenantDto } from './dto';

@Injectable()
export class SuperAdminTenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: TenantQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
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

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('테넌트를 찾을 수 없습니다.');
    }

    return tenant;
  }

  async create(dto: CreateTenantDto) {
    try {
      return await this.prisma.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          settings: dto.settings || {},
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('slug')) {
          throw new ConflictException('이미 사용 중인 slug입니다.');
        }
        if (target.includes('domain')) {
          throw new ConflictException('이미 사용 중인 도메인입니다.');
        }
        throw new ConflictException('중복된 값이 존재합니다.');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('테넌트를 찾을 수 없습니다.');
    }

    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('slug')) {
          throw new ConflictException('이미 사용 중인 slug입니다.');
        }
        if (target.includes('domain')) {
          throw new ConflictException('이미 사용 중인 도메인입니다.');
        }
        throw new ConflictException('중복된 값이 존재합니다.');
      }
      throw error;
    }
  }

  async remove(id: string) {
    if (id === DEFAULT_TENANT_ID) {
      throw new BadRequestException('기본 테넌트는 삭제할 수 없습니다.');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('테넌트를 찾을 수 없습니다.');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
