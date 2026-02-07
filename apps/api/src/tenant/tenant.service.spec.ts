import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: MockPrismaService;

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

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = mockPrisma;
  });

  it('서비스가 정의되어 있는지', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('ID로 테넌트를 조회한다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById('default-tenant');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'default-tenant' },
      });
      expect(result).toEqual(mockTenant);
    });

    it('존재하지 않는 테넌트이면 null을 반환한다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('slug으로 테넌트를 조회한다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySlug('phonegabi');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'phonegabi' },
      });
      expect(result).toEqual(mockTenant);
    });

    it('존재하지 않는 slug이면 null을 반환한다', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultTenantId', () => {
    it('기본 테넌트 ID를 반환한다', async () => {
      const result = await service.getDefaultTenantId();

      expect(result).toBe('default-tenant');
    });
  });
});
