import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  createMockPrismaService,
  MockPrismaService,
} from "../test-utils/prisma-mock";

jest.mock("bcrypt");

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  const mockUser = {
    id: "user-uuid-1",
    email: "test@example.com",
    password: "hashed-password",
    name: "홍길동",
    phone: "010-1234-5678",
    role: "USER",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = { sign: jest.fn().mockReturnValue("mock-token") };
    configService = { get: jest.fn().mockReturnValue("15m") };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------
  describe("register", () => {
    const registerDto = {
      email: "new@example.com",
      password: "Password123!",
      name: "김철수",
      phone: "010-9876-5432",
    };

    const createdUser = {
      id: "new-user-uuid",
      email: registerDto.email,
      name: registerDto.name,
      phone: registerDto.phone,
      role: "USER",
      createdAt: new Date(),
    };

    it("정상 등록 시 사용자와 토큰을 반환한다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashed-pw");
      prisma.user.create.mockResolvedValue(createdUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: "hashed-pw",
          name: registerDto.name,
          phone: registerDto.phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual({
        user: createdUser,
        accessToken: "mock-token",
        refreshToken: "mock-token",
      });
    });

    it("이메일 중복 시 ConflictException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        "이미 사용중인 이메일입니다.",
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  describe("login", () => {
    const loginDto = { email: "test@example.com", password: "Password123!" };

    it("정상 로그인 시 사용자 정보와 토큰을 반환한다", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          phone: mockUser.phone,
          role: mockUser.role,
        },
        accessToken: "mock-token",
        refreshToken: "mock-token",
      });
    });

    it("존재하지 않는 사용자일 경우 UnauthorizedException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    });

    it("비활성 계정일 경우 UnauthorizedException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "비활성화된 계정입니다.",
      );
    });

    it("잘못된 비밀번호일 경우 UnauthorizedException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------
  describe("logout", () => {
    const userId = "user-uuid-1";

    it("특정 리프레시 토큰을 삭제한다", async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout(userId, "specific-token");

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId, token: "specific-token" },
      });
      expect(result).toEqual({ message: "로그아웃 되었습니다." });
    });

    it("리프레시 토큰 미제공 시 사용자의 모든 토큰을 삭제한다", async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.logout(userId);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toEqual({ message: "로그아웃 되었습니다." });
    });
  });

  // ---------------------------------------------------------------------------
  // refreshTokens
  // ---------------------------------------------------------------------------
  describe("refreshTokens", () => {
    const storedToken = {
      id: "token-id-1",
      token: "valid-refresh-token",
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      user: mockUser,
    };

    it("정상적으로 새 토큰 쌍을 발급한다", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken);
      prisma.refreshToken.delete.mockResolvedValue(storedToken);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens("valid-refresh-token");

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: "valid-refresh-token" },
        include: { user: true },
      });
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: storedToken.id },
      });
      expect(result).toEqual({
        accessToken: "mock-token",
        refreshToken: "mock-token",
      });
    });

    it("존재하지 않는 토큰일 경우 UnauthorizedException을 던진다", async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens("invalid-token")).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshTokens("invalid-token")).rejects.toThrow(
        "유효하지 않은 토큰입니다.",
      );
    });

    it("만료된 토큰일 경우 토큰을 삭제하고 UnauthorizedException을 던진다", async () => {
      const expiredToken = {
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000), // 이미 만료
      };
      prisma.refreshToken.findUnique.mockResolvedValue(expiredToken);
      prisma.refreshToken.delete.mockResolvedValue(expiredToken);

      await expect(
        service.refreshTokens("valid-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens("valid-refresh-token"),
      ).rejects.toThrow("토큰이 만료되었습니다.");
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: expiredToken.id },
      });
    });

    it("비활성 계정의 토큰일 경우 UnauthorizedException을 던진다", async () => {
      const inactiveUserToken = {
        ...storedToken,
        user: { ...mockUser, isActive: false },
      };
      prisma.refreshToken.findUnique.mockResolvedValue(inactiveUserToken);

      await expect(
        service.refreshTokens("valid-refresh-token"),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens("valid-refresh-token"),
      ).rejects.toThrow("비활성화된 계정입니다.");
    });
  });

  // ---------------------------------------------------------------------------
  // getProfile
  // ---------------------------------------------------------------------------
  describe("getProfile", () => {
    it("사용자 프로필과 주소 목록을 반환한다", async () => {
      const profileData = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        phone: mockUser.phone,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        addresses: [
          {
            id: "addr-1",
            label: "집",
            address: "서울시 강남구",
            isDefault: true,
          },
        ],
      };
      prisma.user.findUnique.mockResolvedValue(profileData);

      const result = await service.getProfile(mockUser.id);

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
      expect(result).toEqual(profileData);
    });

    it("존재하지 않는 사용자일 경우 BadRequestException을 던진다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile("nonexistent-id")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProfile("nonexistent-id")).rejects.toThrow(
        "사용자를 찾을 수 없습니다.",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // generateTokens (private, tested indirectly via register/login)
  // ---------------------------------------------------------------------------
  describe("generateTokens (간접 테스트)", () => {
    it("accessToken과 refreshToken에 서로 다른 만료 옵션을 전달한다", async () => {
      configService.get
        .mockReturnValueOnce("30m") // JWT_ACCESS_EXPIRY
        .mockReturnValueOnce("14d"); // JWT_REFRESH_EXPIRY

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.login({ email: mockUser.email, password: "Password123!" });

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: "30m" },
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: "14d" },
      );
    });

    it("리프레시 토큰을 DB에 저장한다", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue("hashed");
      prisma.user.create.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        name: "T",
        phone: null,
        role: "USER",
        createdAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({});

      await service.register({
        email: "a@b.com",
        password: "Password1!",
        name: "T",
      });

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: "mock-token",
          userId: "u1",
          expiresAt: expect.any(Date),
        },
      });
    });
  });
});
