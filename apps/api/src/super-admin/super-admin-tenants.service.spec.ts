import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { SuperAdminTenantsService } from './super-admin-tenants.service';
import { TenantQueryDto, CreateTenantDto, UpdateTenantDto } from './dto';

describe('SuperAdminTenantsService', () => {
  let service: SuperAdminTenantsService;
  let prisma: MockPrismaService;

  const mockTenant = {
    id: 'tenant-1',
    name: '테스트 테넌트',
    slug: 'test-tenant',
    domain: null,
    settings: {},
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTenantWithCount = {
    ...mockTenant,
    _count: { users: 3 },
  };

  const mockTenantWithUsers = {
    ...mockTenant,
    users: [
      {
        user: {
          id: 'user-1',
          name: '테스트 사용자',
          email: 'test@example.com',
          role: 'USER',
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminTenantsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuperAdminTenantsService>(SuperAdminTenantsService);
    prisma = mockPrisma;
  });

  it('서비스가 정의되어 있는지', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('기본 테넌트 목록을 반환한다', async () => {
      prisma.tenant.findMany.mockResolvedValue([mockTenantWithCount]);
      prisma.tenant.count.mockResolvedValue(1);

      const query: TenantQueryDto = {};
      const result = await service.findAll(query);

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          include: { _count: { select: { users: true } } },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
      expect(prisma.tenant.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: [mockTenantWithCount],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it('검색 필터를 적용한다', async () => {
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(0);

      const query: TenantQueryDto = { search: '테스트' };
      await service.findAll(query);

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: '테스트', mode: 'insensitive' } },
              { slug: { contains: '테스트', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('isActive 필터를 적용한다', async () => {
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(0);

      const query: TenantQueryDto = { isActive: true };
      await service.findAll(query);

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });

    it('페이지네이션을 적용한다', async () => {
      prisma.tenant.findMany.mockResolvedValue([]);
      prisma.tenant.count.mockResolvedValue(50);

      const query: TenantQueryDto = { page: 3, limit: 10 };
      const result = await service.findAll(query);

      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });
  });

  describe('findOne', () => {
    it('ID로 테넌트를 조회한다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenantWithUsers);

      const result = await service.findOne('tenant-1');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        include: {
          users: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockTenantWithUsers);
    });

    it('존재하지 않는 테넌트이면 NotFoundException을 던진다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('테넌트를 정상적으로 생성한다', async () => {
      const dto: CreateTenantDto = {
        name: '새 테넌트',
        slug: 'new-tenant',
        domain: 'new.example.com',
        settings: { theme: 'dark' },
      };
      const createdTenant = {
        ...mockTenant,
        id: 'tenant-new',
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain,
        settings: dto.settings,
      };
      prisma.tenant.create.mockResolvedValue(createdTenant);

      const result = await service.create(dto);

      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          settings: dto.settings,
        },
      });
      expect(result).toEqual(createdTenant);
    });

    it('settings가 없으면 빈 객체로 생성한다', async () => {
      const dto: CreateTenantDto = {
        name: '새 테넌트',
        slug: 'new-tenant',
      };
      prisma.tenant.create.mockResolvedValue({ ...mockTenant });

      await service.create(dto);

      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: undefined,
          settings: {},
        },
      });
    });

    it('slug 중복 시 ConflictException을 던진다', async () => {
      const dto: CreateTenantDto = {
        name: '새 테넌트',
        slug: 'existing-slug',
      };
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['slug'] },
        },
      );
      prisma.tenant.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        '이미 사용 중인 slug입니다.',
      );
    });

    it('domain 중복 시 ConflictException을 던진다', async () => {
      const dto: CreateTenantDto = {
        name: '새 테넌트',
        slug: 'new-slug',
        domain: 'existing.example.com',
      };
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['domain'] },
        },
      );
      prisma.tenant.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        '이미 사용 중인 도메인입니다.',
      );
    });
  });

  describe('update', () => {
    it('테넌트를 정상적으로 수정한다', async () => {
      const dto: UpdateTenantDto = { name: '수정된 테넌트' };
      const updatedTenant = { ...mockTenant, name: dto.name };
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.update('tenant-1', dto);

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: dto,
      });
      expect(result).toEqual(updatedTenant);
    });

    it('존재하지 않는 테넌트이면 NotFoundException을 던진다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: '수정' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('slug 중복 시 ConflictException을 던진다', async () => {
      const dto: UpdateTenantDto = { slug: 'existing-slug' };
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['slug'] },
        },
      );
      prisma.tenant.update.mockRejectedValue(prismaError);

      await expect(service.update('tenant-1', dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('tenant-1', dto)).rejects.toThrow(
        '이미 사용 중인 slug입니다.',
      );
    });
  });

  describe('remove', () => {
    it('테넌트를 소프트 삭제한다', async () => {
      const deactivatedTenant = { ...mockTenant, isActive: false };
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenant.update.mockResolvedValue(deactivatedTenant);

      const result = await service.remove('tenant-1');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { isActive: false },
      });
      expect(result).toEqual(deactivatedTenant);
    });

    it('기본 테넌트 삭제 시 BadRequestException을 던진다', async () => {
      await expect(service.remove('default-tenant')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('default-tenant')).rejects.toThrow(
        '기본 테넌트는 삭제할 수 없습니다.',
      );
    });

    it('존재하지 않는 테넌트이면 NotFoundException을 던진다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
