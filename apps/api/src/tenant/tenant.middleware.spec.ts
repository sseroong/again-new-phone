import { Test, TestingModule } from '@nestjs/testing';
import { TenantMiddleware } from './tenant.middleware';
import { TenantService } from './tenant.service';
import { TENANT_HEADER } from '@phone-marketplace/shared';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let tenantService: {
    findById: jest.Mock;
    getDefaultTenantId: jest.Mock;
  };

  const mockTenant = {
    id: 'tenant-1',
    name: '테스트 테넌트',
    slug: 'test',
    isActive: true,
  };

  beforeEach(async () => {
    tenantService = {
      findById: jest.fn(),
      getDefaultTenantId: jest.fn().mockResolvedValue('default-tenant'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMiddleware,
        { provide: TenantService, useValue: tenantService },
      ],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
  });

  it('미들웨어가 정의되어 있는지', () => {
    expect(middleware).toBeDefined();
  });

  it('유효한 X-Tenant-ID 헤더가 있으면 해당 tenantId를 설정한다', async () => {
    tenantService.findById.mockResolvedValue(mockTenant);
    const req: any = { headers: { [TENANT_HEADER]: 'tenant-1' } };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(tenantService.findById).toHaveBeenCalledWith('tenant-1');
    expect(req.tenantId).toBe('tenant-1');
    expect(next).toHaveBeenCalled();
  });

  it('비활성 테넌트이면 기본 테넌트로 폴백한다', async () => {
    tenantService.findById.mockResolvedValue({ ...mockTenant, isActive: false });
    const req: any = { headers: { [TENANT_HEADER]: 'inactive-tenant' } };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenantId).toBe('default-tenant');
    expect(next).toHaveBeenCalled();
  });

  it('존재하지 않는 테넌트이면 기본 테넌트로 폴백한다', async () => {
    tenantService.findById.mockResolvedValue(null);
    const req: any = { headers: { [TENANT_HEADER]: 'nonexistent' } };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenantId).toBe('default-tenant');
    expect(next).toHaveBeenCalled();
  });

  it('헤더가 없으면 기본 테넌트를 사용한다', async () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(tenantService.findById).not.toHaveBeenCalled();
    expect(req.tenantId).toBe('default-tenant');
    expect(next).toHaveBeenCalled();
  });
});
