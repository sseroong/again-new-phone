import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let prisma: MockPrismaService;

  function createMockContext(user: any, tenantId?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, tenantId }),
      }),
    } as any;
  }

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    prisma = mockPrisma;
  });

  it('가드가 정의되어 있는지', () => {
    expect(guard).toBeDefined();
  });

  it('Public 엔드포인트(user 없음)는 통과한다', async () => {
    const context = createMockContext(null, 'default-tenant');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(prisma.userTenant.findUnique).not.toHaveBeenCalled();
  });

  it('SUPER_ADMIN은 모든 테넌트에 접근 가능하다', async () => {
    const superAdmin = { id: 'admin-1', role: UserRole.SUPER_ADMIN };
    const context = createMockContext(superAdmin, 'any-tenant');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(prisma.userTenant.findUnique).not.toHaveBeenCalled();
  });

  it('tenantId가 없으면 ForbiddenException을 던진다', async () => {
    const user = { id: 'user-1', role: UserRole.USER };
    const context = createMockContext(user, undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      '테넌트 정보가 없습니다.',
    );
  });

  it('UserTenant에 소속된 사용자는 통과한다', async () => {
    const user = { id: 'user-1', role: UserRole.USER };
    const context = createMockContext(user, 'tenant-1');
    prisma.userTenant.findUnique.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      isActive: true,
      role: UserRole.USER,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(prisma.userTenant.findUnique).toHaveBeenCalledWith({
      where: {
        userId_tenantId: {
          userId: 'user-1',
          tenantId: 'tenant-1',
        },
      },
    });
  });

  it('UserTenant에 소속되지 않은 사용자는 ForbiddenException', async () => {
    const user = { id: 'user-1', role: UserRole.USER };
    const context = createMockContext(user, 'tenant-1');
    prisma.userTenant.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      '해당 테넌트에 대한 접근 권한이 없습니다.',
    );
  });

  it('비활성 UserTenant이면 ForbiddenException', async () => {
    const user = { id: 'user-1', role: UserRole.USER };
    const context = createMockContext(user, 'tenant-1');
    prisma.userTenant.findUnique.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      isActive: false,
      role: UserRole.USER,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('ADMIN 역할도 UserTenant 소속 확인이 필요하다', async () => {
    const admin = { id: 'admin-1', role: UserRole.ADMIN };
    const context = createMockContext(admin, 'tenant-1');
    prisma.userTenant.findUnique.mockResolvedValue({
      userId: 'admin-1',
      tenantId: 'tenant-1',
      isActive: true,
      role: UserRole.ADMIN,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(prisma.userTenant.findUnique).toHaveBeenCalled();
  });
});
