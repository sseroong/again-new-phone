import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SellRequestStatus } from '@prisma/client';
import { SellRequestsService } from './sell-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from '../test-utils/prisma-mock';

describe('SellRequestsService', () => {
  let service: SellRequestsService;
  let prisma: MockPrismaService;

  const userId = 'user-uuid-1';

  const createSellRequestDto = {
    category: 'SMARTPHONE' as const,
    brand: 'APPLE' as const,
    modelName: '아이폰 15 Pro',
    storage: '256GB',
    color: '블랙 티타늄',
    selfGrade: 'A' as const,
    estimatedPrice: 1000000,
    tradeMethod: 'COURIER' as const,
    deviceCondition: {
      powerOn: true,
      screenCondition: '양호',
      bodyCondition: '미세 스크래치',
      buttonsWorking: true,
      batteryHealth: 92,
      notes: '충전기 미포함',
    },
  };

  const mockSellRequest = {
    id: 'sell-request-uuid-1',
    userId,
    category: 'SMARTPHONE',
    brand: 'APPLE',
    modelName: '아이폰 15 Pro',
    storage: '256GB',
    color: '블랙 티타늄',
    selfGrade: 'A',
    estimatedPrice: 1000000,
    tradeMethod: 'COURIER',
    deviceCondition: {
      powerOn: true,
      screenCondition: '양호',
      bodyCondition: '미세 스크래치',
      buttonsWorking: true,
      batteryHealth: 92,
      notes: '충전기 미포함',
    },
    status: SellRequestStatus.PENDING,
    finalPrice: null,
    trackingNumber: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    quotes: [],
  };

  const mockQuote1 = {
    id: 'quote-uuid-1',
    sellRequestId: 'sell-request-uuid-1',
    price: 950000,
    grade: 'A',
    notes: '상태 양호',
    isAccepted: false,
    createdAt: new Date('2024-01-02'),
  };

  const mockQuote2 = {
    id: 'quote-uuid-2',
    sellRequestId: 'sell-request-uuid-1',
    price: 900000,
    grade: 'B_PLUS',
    notes: '경미한 스크래치 확인',
    isAccepted: false,
    createdAt: new Date('2024-01-02'),
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellRequestsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SellRequestsService>(SellRequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('정상적으로 판매 접수를 생성한다', async () => {
      prisma.sellRequest.create.mockResolvedValue(mockSellRequest);

      const result = await service.create(userId, createSellRequestDto);

      expect(prisma.sellRequest.create).toHaveBeenCalledWith({
        data: {
          userId,
          category: createSellRequestDto.category,
          brand: createSellRequestDto.brand,
          modelName: createSellRequestDto.modelName,
          storage: createSellRequestDto.storage,
          color: createSellRequestDto.color,
          selfGrade: createSellRequestDto.selfGrade,
          estimatedPrice: createSellRequestDto.estimatedPrice,
          tradeMethod: createSellRequestDto.tradeMethod,
          deviceCondition: createSellRequestDto.deviceCondition,
        },
      });
      expect(result).toEqual(mockSellRequest);
    });

    it('색상(color) 없이도 생성할 수 있다', async () => {
      const dtoWithoutColor = { ...createSellRequestDto, color: undefined };
      prisma.sellRequest.create.mockResolvedValue({
        ...mockSellRequest,
        color: null,
      });

      const result = await service.create(userId, dtoWithoutColor);

      expect(prisma.sellRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          color: undefined,
        }),
      });
      expect(result.color).toBeNull();
    });

    it('생성 시 상태가 PENDING으로 설정된다', async () => {
      prisma.sellRequest.create.mockResolvedValue(mockSellRequest);

      const result = await service.create(userId, createSellRequestDto);

      expect(result.status).toBe(SellRequestStatus.PENDING);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('사용자의 판매 접수 목록을 페이지네이션하여 반환한다', async () => {
      const sellRequests = [mockSellRequest];
      prisma.sellRequest.findMany.mockResolvedValue(sellRequests);
      prisma.sellRequest.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          quotes: {
            orderBy: { price: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prisma.sellRequest.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual({
        data: sellRequests,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('상태 필터를 적용하여 조회한다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      await service.findAll(userId, {
        status: SellRequestStatus.QUOTED,
        page: 1,
        limit: 10,
      });

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, status: SellRequestStatus.QUOTED },
        }),
      );
      expect(prisma.sellRequest.count).toHaveBeenCalledWith({
        where: { userId, status: SellRequestStatus.QUOTED },
      });
    });

    it('페이지네이션 기본값(page=1, limit=10)을 적용한다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      await service.findAll(userId, {});

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('2페이지 조회 시 skip 값이 올바르다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(25);

      const result = await service.findAll(userId, { page: 2, limit: 10 });

      expect(prisma.sellRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(3);
    });

    it('data와 meta 구조를 올바르게 반환한다', async () => {
      prisma.sellRequest.findMany.mockResolvedValue([]);
      prisma.sellRequest.count.mockResolvedValue(0);

      const result = await service.findAll(userId, {});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('totalPages');
    });
  });

  // ---------------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('판매 접수 상세를 quotes와 함께 반환한다', async () => {
      const sellRequestWithQuotes = {
        ...mockSellRequest,
        quotes: [mockQuote1, mockQuote2],
      };
      prisma.sellRequest.findFirst.mockResolvedValue(sellRequestWithQuotes);

      const result = await service.findOne(userId, 'sell-request-uuid-1');

      expect(prisma.sellRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1', userId },
        include: {
          quotes: {
            orderBy: { price: 'desc' },
          },
        },
      });
      expect(result).toEqual(sellRequestWithQuotes);
      expect(result.quotes).toHaveLength(2);
    });

    it('판매 접수를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(userId, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(userId, 'nonexistent-id'),
      ).rejects.toThrow('판매 접수를 찾을 수 없습니다.');
    });

    it('다른 사용자의 판매 접수는 조회할 수 없다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('other-user', 'sell-request-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const updateDto = {
      tradeMethod: 'PICKUP' as const,
      trackingNumber: '9876543210',
    };

    it('PENDING 상태에서 수정할 수 있다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(mockSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...mockSellRequest,
        ...updateDto,
      });

      const result = await service.update(
        userId,
        'sell-request-uuid-1',
        updateDto,
      );

      expect(prisma.sellRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1', userId },
      });
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1' },
        data: updateDto,
      });
      expect(result.tradeMethod).toBe('PICKUP');
    });

    it('QUOTED 상태에서 수정할 수 있다', async () => {
      const quotedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.QUOTED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(quotedSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...quotedSellRequest,
        ...updateDto,
      });

      await service.update(userId, 'sell-request-uuid-1', updateDto);

      expect(prisma.sellRequest.update).toHaveBeenCalled();
    });

    it('판매 접수를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'nonexistent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(userId, 'nonexistent-id', updateDto),
      ).rejects.toThrow('판매 접수를 찾을 수 없습니다.');
    });

    it('ACCEPTED 상태에서는 수정할 수 없다', async () => {
      const acceptedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.ACCEPTED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(acceptedSellRequest);

      await expect(
        service.update(userId, 'sell-request-uuid-1', updateDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(userId, 'sell-request-uuid-1', updateDto),
      ).rejects.toThrow('현재 상태에서는 수정할 수 없습니다.');
    });

    it('INSPECTING 상태에서는 수정할 수 없다', async () => {
      const inspectingSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.INSPECTING,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(inspectingSellRequest);

      await expect(
        service.update(userId, 'sell-request-uuid-1', updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('COMPLETED 상태에서는 수정할 수 없다', async () => {
      const completedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.COMPLETED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(completedSellRequest);

      await expect(
        service.update(userId, 'sell-request-uuid-1', updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // cancel
  // ---------------------------------------------------------------------------
  describe('cancel', () => {
    it('PENDING 상태에서 정상 취소한다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(mockSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...mockSellRequest,
        status: SellRequestStatus.CANCELLED,
      });

      const result = await service.cancel(userId, 'sell-request-uuid-1');

      expect(prisma.sellRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1', userId },
      });
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1' },
        data: { status: SellRequestStatus.CANCELLED },
      });
      expect(result).toEqual({ message: '판매 접수가 취소되었습니다.' });
    });

    it('QUOTED 상태에서 취소할 수 있다', async () => {
      const quotedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.QUOTED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(quotedSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...quotedSellRequest,
        status: SellRequestStatus.CANCELLED,
      });

      const result = await service.cancel(userId, 'sell-request-uuid-1');

      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1' },
        data: { status: SellRequestStatus.CANCELLED },
      });
      expect(result).toEqual({ message: '판매 접수가 취소되었습니다.' });
    });

    it('ACCEPTED 상태에서 취소할 수 있다', async () => {
      const acceptedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.ACCEPTED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(acceptedSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...acceptedSellRequest,
        status: SellRequestStatus.CANCELLED,
      });

      const result = await service.cancel(userId, 'sell-request-uuid-1');

      expect(result).toEqual({ message: '판매 접수가 취소되었습니다.' });
    });

    it('판매 접수를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.cancel(userId, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.cancel(userId, 'nonexistent-id'),
      ).rejects.toThrow('판매 접수를 찾을 수 없습니다.');
    });

    it('INSPECTING(검수 중) 상태에서는 취소할 수 없다', async () => {
      const inspectingSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.INSPECTING,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(inspectingSellRequest);

      await expect(
        service.cancel(userId, 'sell-request-uuid-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancel(userId, 'sell-request-uuid-1'),
      ).rejects.toThrow('현재 상태에서는 취소할 수 없습니다.');
    });

    it('COMPLETED(완료) 상태에서는 취소할 수 없다', async () => {
      const completedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.COMPLETED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(completedSellRequest);

      await expect(
        service.cancel(userId, 'sell-request-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('CANCELLED 상태에서는 다시 취소할 수 없다', async () => {
      const cancelledSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.CANCELLED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(cancelledSellRequest);

      await expect(
        service.cancel(userId, 'sell-request-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // acceptQuote
  // ---------------------------------------------------------------------------
  describe('acceptQuote', () => {
    const sellRequestWithQuotes = {
      ...mockSellRequest,
      status: SellRequestStatus.QUOTED,
      quotes: [mockQuote1, mockQuote2],
    };

    it('정상적으로 견적을 수락한다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(sellRequestWithQuotes);
      prisma.sellQuote.update.mockResolvedValue({
        ...mockQuote1,
        isAccepted: true,
      });
      prisma.sellRequest.update.mockResolvedValue({
        ...sellRequestWithQuotes,
        status: SellRequestStatus.ACCEPTED,
        finalPrice: 950000,
      });

      const result = await service.acceptQuote(
        userId,
        'sell-request-uuid-1',
        'quote-uuid-1',
      );

      expect(prisma.sellRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1', userId },
        include: { quotes: true },
      });
      expect(prisma.executeInTransaction).toHaveBeenCalledTimes(1);
      expect(prisma.sellQuote.update).toHaveBeenCalledWith({
        where: { id: 'quote-uuid-1' },
        data: { isAccepted: true },
      });
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1' },
        data: {
          status: SellRequestStatus.ACCEPTED,
          finalPrice: 950000,
        },
      });
      expect(result).toEqual({ message: '견적이 수락되었습니다.' });
    });

    it('두 번째 견적을 수락할 수 있다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(sellRequestWithQuotes);
      prisma.sellQuote.update.mockResolvedValue({
        ...mockQuote2,
        isAccepted: true,
      });
      prisma.sellRequest.update.mockResolvedValue({
        ...sellRequestWithQuotes,
        status: SellRequestStatus.ACCEPTED,
        finalPrice: 900000,
      });

      await service.acceptQuote(
        userId,
        'sell-request-uuid-1',
        'quote-uuid-2',
      );

      expect(prisma.sellQuote.update).toHaveBeenCalledWith({
        where: { id: 'quote-uuid-2' },
        data: { isAccepted: true },
      });
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1' },
        data: {
          status: SellRequestStatus.ACCEPTED,
          finalPrice: 900000,
        },
      });
    });

    it('판매 접수를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.acceptQuote(userId, 'nonexistent-id', 'quote-uuid-1'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.acceptQuote(userId, 'nonexistent-id', 'quote-uuid-1'),
      ).rejects.toThrow('판매 접수를 찾을 수 없습니다.');
    });

    it('QUOTED 상태가 아니면 BadRequestException을 던진다', async () => {
      const pendingSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.PENDING,
        quotes: [],
      };
      prisma.sellRequest.findFirst.mockResolvedValue(pendingSellRequest);

      await expect(
        service.acceptQuote(userId, 'sell-request-uuid-1', 'quote-uuid-1'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.acceptQuote(userId, 'sell-request-uuid-1', 'quote-uuid-1'),
      ).rejects.toThrow('견적 수락 가능한 상태가 아닙니다.');
    });

    it('ACCEPTED 상태에서는 추가 수락이 불가하다', async () => {
      const acceptedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.ACCEPTED,
        quotes: [mockQuote1],
      };
      prisma.sellRequest.findFirst.mockResolvedValue(acceptedSellRequest);

      await expect(
        service.acceptQuote(userId, 'sell-request-uuid-1', 'quote-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 견적 ID를 전달하면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(sellRequestWithQuotes);

      await expect(
        service.acceptQuote(
          userId,
          'sell-request-uuid-1',
          'nonexistent-quote',
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.acceptQuote(
          userId,
          'sell-request-uuid-1',
          'nonexistent-quote',
        ),
      ).rejects.toThrow('견적을 찾을 수 없습니다.');
    });

    it('잘못된 견적 ID 시 트랜잭션이 실행되지 않는다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(sellRequestWithQuotes);

      await expect(
        service.acceptQuote(
          userId,
          'sell-request-uuid-1',
          'nonexistent-quote',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.executeInTransaction).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // addTrackingNumber
  // ---------------------------------------------------------------------------
  describe('addTrackingNumber', () => {
    const trackingNumber = '1234567890';

    it('ACCEPTED 상태에서 송장번호를 등록하고 SHIPPING으로 변경한다', async () => {
      const acceptedSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.ACCEPTED,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(acceptedSellRequest);
      prisma.sellRequest.update.mockResolvedValue({
        ...acceptedSellRequest,
        trackingNumber,
        status: SellRequestStatus.SHIPPING,
      });

      const result = await service.addTrackingNumber(
        userId,
        'sell-request-uuid-1',
        trackingNumber,
      );

      expect(prisma.sellRequest.findFirst).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1', userId },
      });
      expect(prisma.sellRequest.update).toHaveBeenCalledWith({
        where: { id: 'sell-request-uuid-1' },
        data: {
          trackingNumber,
          status: SellRequestStatus.SHIPPING,
        },
      });
      expect(result.trackingNumber).toBe(trackingNumber);
      expect(result.status).toBe(SellRequestStatus.SHIPPING);
    });

    it('판매 접수를 찾을 수 없으면 NotFoundException을 던진다', async () => {
      prisma.sellRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.addTrackingNumber(userId, 'nonexistent-id', trackingNumber),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.addTrackingNumber(userId, 'nonexistent-id', trackingNumber),
      ).rejects.toThrow('판매 접수를 찾을 수 없습니다.');
    });

    it('ACCEPTED 상태가 아니면 BadRequestException을 던진다', async () => {
      const pendingSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.PENDING,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(pendingSellRequest);

      await expect(
        service.addTrackingNumber(
          userId,
          'sell-request-uuid-1',
          trackingNumber,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addTrackingNumber(
          userId,
          'sell-request-uuid-1',
          trackingNumber,
        ),
      ).rejects.toThrow('송장번호를 등록할 수 없는 상태입니다.');
    });

    it('SHIPPING 상태에서는 송장번호를 등록할 수 없다', async () => {
      const shippingSellRequest = {
        ...mockSellRequest,
        status: SellRequestStatus.SHIPPING,
      };
      prisma.sellRequest.findFirst.mockResolvedValue(shippingSellRequest);

      await expect(
        service.addTrackingNumber(
          userId,
          'sell-request-uuid-1',
          trackingNumber,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // getEstimatedPrice
  // ---------------------------------------------------------------------------
  describe('getEstimatedPrice', () => {
    it('시세 정보를 반환한다', async () => {
      const mockModel = { id: 'model-1', brand: 'APPLE', name: '아이폰 15 Pro' };
      const mockPriceGuide = {
        id: 'price-guide-1',
        modelId: 'model-1',
        storage: '256GB',
        grade: 'A',
        buyPrice: 900000,
        sellPrice: 1100000,
      };

      prisma.deviceModel.findFirst.mockResolvedValue(mockModel);
      prisma.priceGuide.findFirst.mockResolvedValue(mockPriceGuide);

      const result = await service.getEstimatedPrice(
        'SMARTPHONE',
        'APPLE',
        '아이폰 15 Pro',
        '256GB',
        'A',
      );

      expect(prisma.deviceModel.findFirst).toHaveBeenCalledWith({
        where: {
          brand: 'APPLE',
          name: { contains: '아이폰 15 Pro', mode: 'insensitive' },
        },
      });
      expect(prisma.priceGuide.findFirst).toHaveBeenCalledWith({
        where: {
          modelId: 'model-1',
          storage: '256GB',
          grade: 'A',
        },
      });
      expect(result).toEqual(mockPriceGuide);
    });

    it('모델을 찾을 수 없으면 null을 반환한다', async () => {
      prisma.deviceModel.findFirst.mockResolvedValue(null);

      const result = await service.getEstimatedPrice(
        'SMARTPHONE',
        'APPLE',
        '존재하지 않는 모델',
        '256GB',
        'A',
      );

      expect(result).toBeNull();
      expect(prisma.priceGuide.findFirst).not.toHaveBeenCalled();
    });

    it('시세 정보가 없으면 null을 반환한다', async () => {
      const mockModel = { id: 'model-1', brand: 'APPLE', name: '아이폰 15 Pro' };
      prisma.deviceModel.findFirst.mockResolvedValue(mockModel);
      prisma.priceGuide.findFirst.mockResolvedValue(null);

      const result = await service.getEstimatedPrice(
        'SMARTPHONE',
        'APPLE',
        '아이폰 15 Pro',
        '1TB',
        'A',
      );

      expect(result).toBeNull();
    });
  });
});
