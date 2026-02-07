import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

describe('TenantController', () => {
  let controller: TenantController;
  let tenantService: { resolve: jest.Mock };

  const mockTenant = {
    id: 'default-tenant',
    name: '폰가비',
    slug: 'phonegabi',
    domain: null,
    settings: {},
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTenantWithDomain = {
    id: 'custom-tenant',
    name: '커스텀 스토어',
    slug: 'custom-store',
    domain: 'custom.example.com',
    settings: { theme: 'dark' },
    isActive: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  };

  const mockInactiveTenant = {
    ...mockTenantWithDomain,
    id: 'inactive-tenant',
    isActive: false,
  };

  beforeEach(async () => {
    tenantService = {
      resolve: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [{ provide: TenantService, useValue: tenantService }],
    }).compile();

    controller = module.get<TenantController>(TenantController);
  });

  it('컨트롤러가 정의되어 있는지', () => {
    expect(controller).toBeDefined();
  });

  describe('resolve', () => {
    it('도메인으로 활성 테넌트를 조회한다', async () => {
      tenantService.resolve.mockResolvedValue(mockTenantWithDomain);

      const result = await controller.resolve('custom.example.com', undefined);

      expect(tenantService.resolve).toHaveBeenCalledWith(
        'custom.example.com',
        undefined,
      );
      expect(result).toEqual({
        id: 'custom-tenant',
        name: '커스텀 스토어',
        slug: 'custom-store',
        domain: 'custom.example.com',
        settings: { theme: 'dark' },
      });
    });

    it('도메인이 비활성 테넌트인 경우 서비스가 폴백 결과를 반환한다', async () => {
      // resolve 메서드는 비활성 테넌트를 건너뛰고 기본 테넌트를 반환한다
      tenantService.resolve.mockResolvedValue(mockTenant);

      const result = await controller.resolve('inactive.example.com', undefined);

      expect(tenantService.resolve).toHaveBeenCalledWith(
        'inactive.example.com',
        undefined,
      );
      expect(result).toEqual({
        id: 'default-tenant',
        name: '폰가비',
        slug: 'phonegabi',
        domain: null,
        settings: {},
      });
    });

    it('slug으로 활성 테넌트를 조회한다', async () => {
      tenantService.resolve.mockResolvedValue(mockTenantWithDomain);

      const result = await controller.resolve(undefined, 'custom-store');

      expect(tenantService.resolve).toHaveBeenCalledWith(
        undefined,
        'custom-store',
      );
      expect(result).toEqual({
        id: 'custom-tenant',
        name: '커스텀 스토어',
        slug: 'custom-store',
        domain: 'custom.example.com',
        settings: { theme: 'dark' },
      });
    });

    it('유효하지 않은 도메인과 유효한 slug이 주어지면 slug으로 조회한다', async () => {
      tenantService.resolve.mockResolvedValue(mockTenantWithDomain);

      const result = await controller.resolve(
        'nonexistent.example.com',
        'custom-store',
      );

      expect(tenantService.resolve).toHaveBeenCalledWith(
        'nonexistent.example.com',
        'custom-store',
      );
      expect(result).toEqual({
        id: 'custom-tenant',
        name: '커스텀 스토어',
        slug: 'custom-store',
        domain: 'custom.example.com',
        settings: { theme: 'dark' },
      });
    });

    it('파라미터가 없으면 기본 테넌트를 반환한다', async () => {
      tenantService.resolve.mockResolvedValue(mockTenant);

      const result = await controller.resolve(undefined, undefined);

      expect(tenantService.resolve).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual({
        id: 'default-tenant',
        name: '폰가비',
        slug: 'phonegabi',
        domain: null,
        settings: {},
      });
    });

    it('서비스가 null을 반환하면 null을 반환한다', async () => {
      tenantService.resolve.mockResolvedValue(null);

      const result = await controller.resolve('unknown.example.com', undefined);

      expect(tenantService.resolve).toHaveBeenCalledWith(
        'unknown.example.com',
        undefined,
      );
      expect(result).toBeNull();
    });

    it('응답에 id, name, slug, domain, settings만 포함한다', async () => {
      tenantService.resolve.mockResolvedValue(mockTenantWithDomain);

      const result = await controller.resolve('custom.example.com', undefined);

      // 허용된 필드만 포함되어 있는지 확인
      expect(result).not.toBeNull();
      expect(Object.keys(result!)).toEqual([
        'id',
        'name',
        'slug',
        'domain',
        'settings',
      ]);
      // 내부 필드가 노출되지 않는지 확인
      expect(result).not.toHaveProperty('isActive');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });
  });
});
