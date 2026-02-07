import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { SuperAdminUsersService } from './super-admin-users.service';
import { SuperAdminUserQueryDto, AssignUserTenantDto } from './dto';

describe('SuperAdminUsersService', () => {
  let service: SuperAdminUsersService;
  let prisma: MockPrismaService;

  const mockUser = {
    id: 'user-1',
    name: '홍길동',
    email: 'hong@example.com',
    phone: '010-1234-5678',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    tenants: [],
  };

  const mockTenant = {
    id: 'tenant-1',
    name: '테스트 테넌트',
    slug: 'test-tenant',
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuperAdminUsersService>(SuperAdminUsersService);
    prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 서비스 정의
  // ---------------------------------------------------------------------------
  it('서비스가 정의되어 있는지', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    const mockUsers = [
      mockUser,
      {
        id: 'user-2',
        name: '김철수',
        email: 'kim@example.com',
        phone: '010-9876-5432',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        tenants: [{ tenantId: 'tenant-1', tenant: mockTenant }],
      },
    ];

    it('기본 사용자 목록을 반환한다', async () => {
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.findAll({} as SuperAdminUserQueryDto);

      expect(result).toEqual({
        data: mockUsers,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          select: expect.objectContaining({
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            tenants: expect.objectContaining({
              include: {
                tenant: { select: { id: true, name: true, slug: true } },
              },
            }),
          }),
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });

    it('검색 필터를 적용한다', async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[0]]);
      prisma.user.count.mockResolvedValue(1);

      const query: SuperAdminUserQueryDto = { search: '홍길동' };
      await service.findAll(query);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: '홍길동', mode: 'insensitive' } },
              { email: { contains: '홍길동', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('role 필터를 적용한다', async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[1]]);
      prisma.user.count.mockResolvedValue(1);

      const query: SuperAdminUserQueryDto = { role: UserRole.ADMIN };
      await service.findAll(query);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.ADMIN,
          }),
        }),
      );
    });

    it('tenantId 필터를 적용한다', async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[1]]);
      prisma.user.count.mockResolvedValue(1);

      const query: SuperAdminUserQueryDto = { tenantId: 'tenant-1' };
      await service.findAll(query);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenants: { some: { tenantId: 'tenant-1' } },
          }),
        }),
      );
    });

    it('페이지네이션을 적용한다', async () => {
      prisma.user.findMany.mockResolvedValue([mockUsers[1]]);
      prisma.user.count.mockResolvedValue(25);

      const query: SuperAdminUserQueryDto = { page: 2, limit: 10 };
      const result = await service.findAll(query);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // assignTenant
  // ---------------------------------------------------------------------------
  describe('assignTenant', () => {
    const assignDto: AssignUserTenantDto = {
      tenantId: 'tenant-1',
      role: UserRole.USER,
    };

    const mockUserTenant = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: UserRole.USER,
      user: { id: 'user-1', name: '홍길동', email: 'hong@example.com' },
      tenant: { id: 'tenant-1', name: '테스트 테넌트', slug: 'test-tenant' },
    };

    it('사용자를 테넌트에 정상적으로 할당한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.userTenant.create.mockResolvedValue(mockUserTenant);

      const result = await service.assignTenant('user-1', assignDto);

      expect(result).toEqual(mockUserTenant);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
      expect(prisma.userTenant.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tenantId: 'tenant-1',
          role: UserRole.USER,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tenant: { select: { id: true, name: true, slug: true } },
        },
      });
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignTenant('nonexistent-user', assignDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignTenant('nonexistent-user', assignDto),
      ).rejects.toThrow('사용자를 찾을 수 없습니다.');

      expect(prisma.tenant.findUnique).not.toHaveBeenCalled();
      expect(prisma.userTenant.create).not.toHaveBeenCalled();
    });

    it('테넌트가 없으면 NotFoundException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.assignTenant('user-1', { tenantId: 'nonexistent-tenant' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignTenant('user-1', { tenantId: 'nonexistent-tenant' }),
      ).rejects.toThrow('테넌트를 찾을 수 없습니다.');

      expect(prisma.userTenant.create).not.toHaveBeenCalled();
    });

    it('이미 할당된 사용자이면 ConflictException을 던진다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['userId', 'tenantId'] },
        },
      );
      prisma.userTenant.create.mockRejectedValue(prismaError);

      await expect(
        service.assignTenant('user-1', assignDto),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.assignTenant('user-1', assignDto),
      ).rejects.toThrow('이미 해당 테넌트에 할당된 사용자입니다.');
    });
  });

  // ---------------------------------------------------------------------------
  // removeTenant
  // ---------------------------------------------------------------------------
  describe('removeTenant', () => {
    const mockUserTenant = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: UserRole.USER,
    };

    it('사용자의 테넌트 소속을 정상적으로 해제한다', async () => {
      prisma.userTenant.findUnique.mockResolvedValue(mockUserTenant);
      prisma.userTenant.delete.mockResolvedValue(mockUserTenant);

      const result = await service.removeTenant('user-1', 'tenant-1');

      expect(result).toEqual(mockUserTenant);
      expect(prisma.userTenant.findUnique).toHaveBeenCalledWith({
        where: { userId_tenantId: { userId: 'user-1', tenantId: 'tenant-1' } },
      });
      expect(prisma.userTenant.delete).toHaveBeenCalledWith({
        where: { userId_tenantId: { userId: 'user-1', tenantId: 'tenant-1' } },
      });
    });

    it('소속되지 않은 사용자이면 NotFoundException을 던진다', async () => {
      prisma.userTenant.findUnique.mockResolvedValue(null);

      await expect(
        service.removeTenant('user-1', 'tenant-999'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeTenant('user-1', 'tenant-999'),
      ).rejects.toThrow('해당 테넌트에 소속되지 않은 사용자입니다.');

      expect(prisma.userTenant.delete).not.toHaveBeenCalled();
    });
  });
});
