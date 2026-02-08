import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";

jest.mock("bcrypt");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("UsersService", () => {
  let service: UsersService;
  let prisma: MockPrismaService;

  const mockUser = {
    id: "user-uuid-1",
    email: "test@example.com",
    name: "홍길동",
    phone: "010-1234-5678",
    role: "USER",
    createdAt: new Date("2024-01-01"),
  };

  const mockAddress = {
    id: "addr-uuid-1",
    userId: mockUser.id,
    name: "집",
    phone: "010-1234-5678",
    zipCode: "12345",
    address: "서울시 강남구 테헤란로 123",
    addressDetail: "101동 1001호",
    isDefault: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe("findById", () => {
    const userWithAddresses = {
      ...mockUser,
      addresses: [mockAddress],
    };

    it("정상적으로 사용자를 조회한다", async () => {
      prisma.user.findUnique.mockResolvedValue(userWithAddresses);

      const result = await service.findById(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          addresses: true,
        },
      });
      expect(result).toEqual(userWithAddresses);
    });

    it("존재하지 않는 사용자일 경우 NotFoundException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById("nonexistent-id")).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById("nonexistent-id")).rejects.toThrow(
        "사용자를 찾을 수 없습니다.",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe("update", () => {
    const updateDto = {
      name: "김철수",
      phone: "010-9876-5432",
    };

    const updatedUser = {
      id: mockUser.id,
      email: mockUser.email,
      name: updateDto.name,
      phone: updateDto.phone,
      role: mockUser.role,
    };

    it("정상적으로 사용자 정보를 수정한다", async () => {
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateDto,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it("이름만 수정할 수 있다", async () => {
      const nameOnlyDto = { name: "박민수" };
      prisma.user.update.mockResolvedValue({
        ...updatedUser,
        name: nameOnlyDto.name,
      });

      const result = await service.update(mockUser.id, nameOnlyDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: nameOnlyDto,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
      expect(result.name).toBe(nameOnlyDto.name);
    });

    it("전화번호만 수정할 수 있다", async () => {
      const phoneOnlyDto = { phone: "010-5555-6666" };
      prisma.user.update.mockResolvedValue({
        ...updatedUser,
        phone: phoneOnlyDto.phone,
      });

      const result = await service.update(mockUser.id, phoneOnlyDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: phoneOnlyDto,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
      expect(result.phone).toBe(phoneOnlyDto.phone);
    });
  });

  // ---------------------------------------------------------------------------
  // changePassword
  // ---------------------------------------------------------------------------
  describe("changePassword", () => {
    const changePasswordDto = {
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword123!",
    };

    const mockUserWithPassword = {
      ...mockUser,
      password: "hashed-old-password",
      isActive: true,
      lastLoginAt: null,
    };

    it("정상적으로 비밀번호를 변경한다", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-password");
      prisma.user.update.mockResolvedValue(mockUserWithPassword);

      const result = await service.changePassword(
        mockUser.id,
        changePasswordDto,
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUserWithPassword.password,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        10,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: "hashed-new-password" },
      });
      expect(result).toEqual({ message: "비밀번호가 변경되었습니다." });
    });

    it("존재하지 않는 사용자일 경우 NotFoundException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword("nonexistent-id", changePasswordDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.changePassword("nonexistent-id", changePasswordDto),
      ).rejects.toThrow("사용자를 찾을 수 없습니다.");
    });

    it("현재 비밀번호가 틀린 경우 BadRequestException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow("현재 비밀번호가 올바르지 않습니다.");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getAddresses
  // ---------------------------------------------------------------------------
  describe("getAddresses", () => {
    const mockAddresses = [
      { ...mockAddress, isDefault: true, id: "addr-1" },
      { ...mockAddress, isDefault: false, id: "addr-2", name: "회사" },
      { ...mockAddress, isDefault: false, id: "addr-3", name: "본가" },
    ];

    it("정상적으로 배송지 목록을 조회한다", async () => {
      prisma.address.findMany.mockResolvedValue(mockAddresses);

      const result = await service.getAddresses(mockUser.id);

      expect(prisma.address.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: [{ isDefault: "desc" }, { id: "desc" }],
      });
      expect(result).toEqual(mockAddresses);
    });

    it("배송지가 없는 경우 빈 배열을 반환한다", async () => {
      prisma.address.findMany.mockResolvedValue([]);

      const result = await service.getAddresses(mockUser.id);

      expect(result).toEqual([]);
    });

    it("기본 배송지가 먼저 정렬된다", async () => {
      prisma.address.findMany.mockResolvedValue(mockAddresses);

      const result = await service.getAddresses(mockUser.id);

      expect(prisma.address.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: [{ isDefault: "desc" }, { id: "desc" }],
      });
      expect(result[0].isDefault).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // createAddress
  // ---------------------------------------------------------------------------
  describe("createAddress", () => {
    const createAddressDto = {
      name: "회사",
      phone: "010-1234-5678",
      zipCode: "54321",
      address: "서울시 서초구 강남대로 123",
      addressDetail: "5층",
      isDefault: false,
    };

    const createdAddress = {
      id: "new-addr-uuid",
      userId: mockUser.id,
      ...createAddressDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("정상적으로 배송지를 생성한다", async () => {
      prisma.address.updateMany.mockResolvedValue({ count: 0 });
      prisma.address.create.mockResolvedValue(createdAddress);

      const result = await service.createAddress(mockUser.id, createAddressDto);

      expect(prisma.address.create).toHaveBeenCalledWith({
        data: {
          ...createAddressDto,
          userId: mockUser.id,
        },
      });
      expect(result).toEqual(createdAddress);
    });

    it("기본 배송지로 생성 시 기존 기본 배송지를 해제한다", async () => {
      const defaultAddressDto = { ...createAddressDto, isDefault: true };
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.create.mockResolvedValue({
        ...createdAddress,
        isDefault: true,
      });

      const result = await service.createAddress(
        mockUser.id,
        defaultAddressDto,
      );

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.address.create).toHaveBeenCalled();
      expect(result.isDefault).toBe(true);
    });

    it("기본 배송지가 아닌 경우 기존 배송지를 수정하지 않는다", async () => {
      prisma.address.updateMany.mockResolvedValue({ count: 0 });
      prisma.address.create.mockResolvedValue(createdAddress);

      await service.createAddress(mockUser.id, createAddressDto);

      expect(prisma.address.updateMany).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateAddress
  // ---------------------------------------------------------------------------
  describe("updateAddress", () => {
    const updateAddressDto = {
      name: "새 회사",
      phone: "010-9999-8888",
      isDefault: false,
    };

    const updatedAddress = {
      ...mockAddress,
      ...updateAddressDto,
    };

    it("정상적으로 배송지를 수정한다", async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 0 });
      prisma.address.update.mockResolvedValue(updatedAddress);

      const result = await service.updateAddress(
        mockUser.id,
        mockAddress.id,
        updateAddressDto,
      );

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: { id: mockAddress.id, userId: mockUser.id },
      });
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
        data: updateAddressDto,
      });
      expect(result).toEqual(updatedAddress);
    });

    it("존재하지 않는 배송지일 경우 NotFoundException을 던진다", async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAddress(
          mockUser.id,
          "nonexistent-addr",
          updateAddressDto,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateAddress(
          mockUser.id,
          "nonexistent-addr",
          updateAddressDto,
        ),
      ).rejects.toThrow("배송지를 찾을 수 없습니다.");
    });

    it("다른 사용자의 배송지를 수정하려는 경우 NotFoundException을 던진다", async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAddress(
          "other-user-id",
          mockAddress.id,
          updateAddressDto,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateAddress(
          "other-user-id",
          mockAddress.id,
          updateAddressDto,
        ),
      ).rejects.toThrow("배송지를 찾을 수 없습니다.");
    });

    it("기본 배송지로 변경 시 기존 기본 배송지를 해제한다", async () => {
      const makeDefaultDto = { ...updateAddressDto, isDefault: true };
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.update.mockResolvedValue({
        ...updatedAddress,
        isDefault: true,
      });

      const result = await service.updateAddress(
        mockUser.id,
        mockAddress.id,
        makeDefaultDto,
      );

      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          isDefault: true,
          id: { not: mockAddress.id },
        },
        data: { isDefault: false },
      });
      expect(result.isDefault).toBe(true);
    });

    it("기본 배송지가 아닌 경우 다른 배송지를 수정하지 않는다", async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 0 });
      prisma.address.update.mockResolvedValue(updatedAddress);

      await service.updateAddress(
        mockUser.id,
        mockAddress.id,
        updateAddressDto,
      );

      expect(prisma.address.updateMany).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteAddress
  // ---------------------------------------------------------------------------
  describe("deleteAddress", () => {
    it("정상적으로 배송지를 삭제한다", async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.delete.mockResolvedValue(mockAddress);

      const result = await service.deleteAddress(mockUser.id, mockAddress.id);

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: { id: mockAddress.id, userId: mockUser.id },
      });
      expect(prisma.address.delete).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
      });
      expect(result).toEqual({ message: "배송지가 삭제되었습니다." });
    });

    it("존재하지 않는 배송지일 경우 NotFoundException을 던진다", async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteAddress(mockUser.id, "nonexistent-addr"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteAddress(mockUser.id, "nonexistent-addr"),
      ).rejects.toThrow("배송지를 찾을 수 없습니다.");
      expect(prisma.address.delete).not.toHaveBeenCalled();
    });

    it("다른 사용자의 배송지를 삭제하려는 경우 NotFoundException을 던진다", async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteAddress("other-user-id", mockAddress.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteAddress("other-user-id", mockAddress.id),
      ).rejects.toThrow("배송지를 찾을 수 없습니다.");
    });
  });

  // ---------------------------------------------------------------------------
  // setDefaultAddress
  // ---------------------------------------------------------------------------
  describe("setDefaultAddress", () => {
    const updatedDefaultAddress = {
      ...mockAddress,
      isDefault: true,
    };

    it("정상적으로 기본 배송지를 설정한다", async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.update.mockResolvedValue(updatedDefaultAddress);

      const result = await service.setDefaultAddress(
        mockUser.id,
        mockAddress.id,
      );

      expect(prisma.address.findFirst).toHaveBeenCalledWith({
        where: { id: mockAddress.id, userId: mockUser.id },
      });
      expect(prisma.address.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isDefault: true },
        data: { isDefault: false },
      });
      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
        data: { isDefault: true },
      });
      expect(result).toEqual(updatedDefaultAddress);
    });

    it("존재하지 않는 배송지일 경우 NotFoundException을 던진다", async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.setDefaultAddress(mockUser.id, "nonexistent-addr"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.setDefaultAddress(mockUser.id, "nonexistent-addr"),
      ).rejects.toThrow("배송지를 찾을 수 없습니다.");
      expect(prisma.address.updateMany).not.toHaveBeenCalled();
      expect(prisma.address.update).not.toHaveBeenCalled();
    });

    it("다른 사용자의 배송지를 기본으로 설정하려는 경우 NotFoundException을 던진다", async () => {
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.setDefaultAddress("other-user-id", mockAddress.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.setDefaultAddress("other-user-id", mockAddress.id),
      ).rejects.toThrow("배송지를 찾을 수 없습니다.");
    });

    it("기존 기본 배송지를 해제한 후 새 기본 배송지를 설정한다", async () => {
      prisma.address.findFirst.mockResolvedValue(mockAddress);
      prisma.address.updateMany.mockResolvedValue({ count: 1 });
      prisma.address.update.mockResolvedValue(updatedDefaultAddress);

      await service.setDefaultAddress(mockUser.id, mockAddress.id);

      // updateMany가 먼저 호출되어야 함
      const updateManyCalls = prisma.address.updateMany.mock.calls;
      const updateCalls = prisma.address.update.mock.calls;
      expect(updateManyCalls.length).toBe(1);
      expect(updateCalls.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserTenants
  // ---------------------------------------------------------------------------
  describe("getUserTenants", () => {
    const mockUserTenants = [
      {
        id: "ut-uuid-1",
        userId: mockUser.id,
        tenantId: "tenant-uuid-1",
        role: "MEMBER",
        isActive: true,
        joinedAt: new Date("2024-01-15"),
        tenant: { id: "tenant-uuid-1", name: "테넌트A", slug: "tenant-a" },
      },
      {
        id: "ut-uuid-2",
        userId: mockUser.id,
        tenantId: "tenant-uuid-2",
        role: "ADMIN",
        isActive: true,
        joinedAt: new Date("2024-03-20"),
        tenant: { id: "tenant-uuid-2", name: "테넌트B", slug: "tenant-b" },
      },
    ];

    it("정상적으로 사용자의 테넌트 목록을 조회한다", async () => {
      prisma.userTenant.findMany.mockResolvedValue(mockUserTenants);

      const result = await service.getUserTenants(mockUser.id);

      expect(prisma.userTenant.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isActive: true },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { joinedAt: "asc" },
      });
      expect(result).toEqual(mockUserTenants);
      expect(result).toHaveLength(2);
      expect(result[0].tenant.name).toBe("테넌트A");
      expect(result[1].tenant.name).toBe("테넌트B");
    });

    it("테넌트가 없는 사용자의 경우 빈 배열을 반환한다", async () => {
      prisma.userTenant.findMany.mockResolvedValue([]);

      const result = await service.getUserTenants(mockUser.id);

      expect(prisma.userTenant.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isActive: true },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { joinedAt: "asc" },
      });
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("활성 테넌트만 조회한다", async () => {
      prisma.userTenant.findMany.mockResolvedValue([mockUserTenants[0]]);

      await service.getUserTenants(mockUser.id);

      const callArgs = prisma.userTenant.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({
        userId: mockUser.id,
        isActive: true,
      });
    });

    it("가입일 순으로 정렬한다", async () => {
      prisma.userTenant.findMany.mockResolvedValue(mockUserTenants);

      await service.getUserTenants(mockUser.id);

      const callArgs = prisma.userTenant.findMany.mock.calls[0][0];
      expect(callArgs.orderBy).toEqual({ joinedAt: "asc" });
    });
  });
});
