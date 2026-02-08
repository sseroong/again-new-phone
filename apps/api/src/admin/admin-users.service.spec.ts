import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";
import { AdminUsersService } from "./admin-users.service";

describe("AdminUsersService", () => {
  let service: AdminUsersService;
  let prisma: MockPrismaService;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    name: "테스트유저",
    phone: "010-1234-5678",
    role: UserRole.USER,
    isActive: true,
    lastLoginAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  };

  const mockUserWithCounts = {
    ...mockUser,
    _count: {
      orders: 3,
      sellRequests: 1,
      reviews: 2,
    },
  };

  const mockUserDetailWithCounts = {
    ...mockUser,
    _count: {
      orders: 3,
      sellRequests: 1,
      reviews: 2,
      addresses: 1,
    },
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    prisma = mockPrisma;
  });

  // 1. 서비스가 정의되어 있는지
  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    // 2. 전체 회원 목록을 반환한다
    it("전체 회원 목록을 반환한다", async () => {
      const users = [mockUserWithCounts];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: users,
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: "desc" },
          skip: 0,
          take: 20,
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });

    // 3. 역할 필터를 적용한다
    it("역할 필터를 적용한다", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ role: UserRole.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.ADMIN },
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });

    // 4. 활성 상태 필터를 적용한다
    it("활성 상태 필터를 적용한다", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ isActive: false });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: false },
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { isActive: false },
      });
    });

    // 5. 검색어 필터를 적용한다
    it("검색어 필터를 적용한다", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ search: "테스트" });

      const expectedWhere = {
        OR: [
          { name: { contains: "테스트", mode: "insensitive" } },
          { email: { contains: "테스트", mode: "insensitive" } },
        ],
      };

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });

    // 6. 페이지네이션을 적용한다
    it("페이지네이션을 적용한다", async () => {
      const users = [mockUserWithCounts];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result).toEqual({
        data: users,
        meta: {
          total: 50,
          page: 3,
          limit: 10,
          totalPages: 5,
        },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  describe("findOne", () => {
    // 7. 회원 상세를 반환한다
    it("회원 상세를 반환한다", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserDetailWithCounts);

      const result = await service.findOne("user-1");

      expect(result).toEqual(mockUserDetailWithCounts);
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
        }),
      );
    });

    // 8. 회원이 없으면 NotFoundException
    it("회원이 없으면 NotFoundException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    // 9. 회원 역할을 변경한다
    it("회원 역할을 변경한다", async () => {
      const updatedUser = { ...mockUser, role: UserRole.ADMIN };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update("user-1", {
        role: UserRole.ADMIN,
      });

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { role: UserRole.ADMIN },
        }),
      );
    });

    // 10. 회원 활성 상태를 변경한다
    it("회원 활성 상태를 변경한다", async () => {
      const updatedUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update("user-1", { isActive: false });

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: { isActive: false },
        }),
      );
    });

    // 11. 존재하지 않는 회원이면 NotFoundException
    it("존재하지 않는 회원이면 NotFoundException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update("nonexistent-id", { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    // 12. SUPER_ADMIN의 역할은 변경할 수 없다 (BadRequestException)
    it("SUPER_ADMIN의 역할은 변경할 수 없다", async () => {
      const superAdminUser = {
        ...mockUser,
        id: "super-admin-1",
        role: UserRole.SUPER_ADMIN,
      };
      prisma.user.findUnique.mockResolvedValue(superAdminUser);

      await expect(
        service.update("super-admin-1", { role: UserRole.USER }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
