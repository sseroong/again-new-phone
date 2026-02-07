import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SellRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';
import { AdminSellRequestsService } from './admin-sell-requests.service';

describe('AdminSellRequestsService', () => {
  let service: AdminSellRequestsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSellRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminSellRequestsService>(AdminSellRequestsService);
    prisma = mockPrisma;
  });

  const mockUser = {
    id: 'user-1',
    name: '홍길동',
    email: 'hong@example.com',
    phone: '010-1234-5678',
  };

  const mockSellRequest = {
    id: 'sell-req-1',
    userId: 'user-1',
    modelName: 'iPhone 15 Pro',
    status: SellRequestStatus.PENDING,
    finalGrade: null,
    finalPrice: null,
    inspectionNotes: null,
    completedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: mockUser,
    quotes: [],
  };

  const mockQuote = {
    id: 'quote-1',
    sellRequestId: 'sell-req-1',
    price: 500000,
    notes: '상태 양호',
    createdAt: new Date('2024-01-02'),
  };

  // 1. 서비스가 정의되어 있는지
  it('서비스가 정의되어 있어야 한다', () => {
    expect(service).toBeDefined();
  });

  // --- findAll ---
  describe('findAll', () => {
    // 2. 전체 판매접수 목록을 반환한다
    it('전체 판매접수 목록을 반환한다', async () => {
      const sellRequests = [mockSellRequest];
      prisma.sellRequest.findMany.mockResolvedValue(sellRequests);
      prisma.sellRequest.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: sellRequests,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            quotes: { orderBy: { createdAt: 'desc' } },
          },
        }),
      );
      expect(prisma.sellRequest.count).toHaveBeenCalledWith({ where: {} });
    });

    // 3. 상태 필터를 적용한다
    it('상태 필터를 적용한다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      await service.findAll({ status: SellRequestStatus.PENDING });

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: SellRequestStatus.PENDING },
        }),
      );
      expect(prisma.sellRequest.count).toHaveBeenCalledWith({
        where: { status: SellRequestStatus.PENDING },
      });
    });

    // 4. 검색어 필터를 적용한다
    it('검색어 필터를 적용한다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      await service.findAll({ search: 'iPhone' });

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { modelName: { contains: 'iPhone', mode: 'insensitive' } },
              {
                user: { name: { contains: 'iPhone', mode: 'insensitive' } },
              },
              {
                user: { email: { contains: 'iPhone', mode: 'insensitive' } },
              },
            ],
          },
        }),
      );
    });

    // 5. 페이지네이션을 적용한다
    it('페이지네이션을 적용한다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
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

  // --- findOne ---
  describe('findOne', () => {
    // 6. 판매접수 상세를 반환한다
    it('판매접수 상세를 반환한다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue(mockSellRequest);

      const result = await service.findOne('sell-req-1');

      expect(result).toEqual(mockSellRequest);
      expect(prisma.sellRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'sell-req-1' },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          quotes: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    // 7. 판매접수가 없으면 NotFoundException
    it('판매접수가 없으면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // --- update ---
  describe('update', () => {
    // 8. 판매접수를 수정한다
    it('판매접수를 수정한다', async () => {
      const updatedSellRequest = {
        ...mockSellRequest,
        inspectionNotes: '스크래치 있음',
      };
      prisma.sellRequest.findUnique.mockResolvedValue(mockSellRequest);
      prisma.sellRequest.update.mockResolvedValue(updatedSellRequest);

      const result = await service.update('sell-req-1', {
        inspectionNotes: '스크래치 있음',
      });

      expect(result).toEqual(updatedSellRequest);
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-req-1' },
        data: { inspectionNotes: '스크래치 있음' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          quotes: true,
        },
      });
    });

    // 9. 존재하지 않는 판매접수면 NotFoundException
    it('존재하지 않는 판매접수면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { inspectionNotes: '메모' }),
      ).rejects.toThrow(NotFoundException);
    });

    // 10. COMPLETED 상태로 변경 시 completedAt을 설정한다
    it('COMPLETED 상태로 변경 시 completedAt을 설정한다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue(mockSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...mockSellRequest,
        status: SellRequestStatus.COMPLETED,
        completedAt: new Date(),
      });

      await service.update('sell-req-1', {
        status: SellRequestStatus.COMPLETED,
      });

      expect(prisma.sellRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SellRequestStatus.COMPLETED,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // --- createQuote ---
  describe('createQuote', () => {
    // 11. 견적을 생성하고 상태를 QUOTED로 변경한다
    it('견적을 생성하고 상태를 QUOTED로 변경한다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue(mockSellRequest);
      prisma.sellQuote.create.mockResolvedValue(mockQuote);
      prisma.sellRequest.update.mockResolvedValue({
        ...mockSellRequest,
        status: SellRequestStatus.QUOTED,
      });

      const result = await service.createQuote('sell-req-1', {
        price: 500000,
        notes: '상태 양호',
      });

      expect(result).toEqual(mockQuote);
      expect(prisma.sellQuote.create).toHaveBeenCalledWith({
        data: {
          sellRequestId: 'sell-req-1',
          tenantId: 'default-tenant',
          price: 500000,
          notes: '상태 양호',
        },
      });
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-req-1' },
        data: { status: SellRequestStatus.QUOTED },
      });
    });

    // 12. 존재하지 않는 판매접수면 NotFoundException
    it('존재하지 않는 판매접수면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.createQuote('non-existent', { price: 500000 }),
      ).rejects.toThrow(NotFoundException);
    });

    // 13. PENDING이 아닌 상태에서 견적 생성 시 BadRequestException
    it('PENDING이 아닌 상태에서 견적 생성 시 BadRequestException을 던진다', async () => {
      prisma.sellRequest.findUnique.mockResolvedValue({
        ...mockSellRequest,
        status: SellRequestStatus.ACCEPTED,
      });

      await expect(
        service.createQuote('sell-req-1', { price: 500000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
