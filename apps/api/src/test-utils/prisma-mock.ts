import { PrismaService } from "../prisma/prisma.service";

type MockPrismaModel = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
};

function createMockModel(): MockPrismaModel {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };
}

export type MockPrismaService = {
  [K in keyof PrismaService]: K extends "executeInTransaction"
    ? jest.Mock
    : K extends "$transaction"
      ? jest.Mock
      : any;
} & {
  user: MockPrismaModel;
  refreshToken: MockPrismaModel;
  product: MockPrismaModel;
  category: MockPrismaModel;
  deviceModel: MockPrismaModel;
  modelVariant: MockPrismaModel;
  order: MockPrismaModel;
  orderItem: MockPrismaModel;
  payment: MockPrismaModel;
  sellRequest: MockPrismaModel;
  sellQuote: MockPrismaModel;
  review: MockPrismaModel;
  priceGuide: MockPrismaModel;
  priceHistory: MockPrismaModel;
  address: MockPrismaModel;
  tenant: MockPrismaModel;
  userTenant: MockPrismaModel;
  content: MockPrismaModel;
  banner: MockPrismaModel;
};

export function createMockPrismaService(): MockPrismaService {
  const mock: Record<string, any> = {
    user: createMockModel(),
    refreshToken: createMockModel(),
    product: createMockModel(),
    category: createMockModel(),
    deviceModel: createMockModel(),
    modelVariant: createMockModel(),
    order: createMockModel(),
    orderItem: createMockModel(),
    payment: createMockModel(),
    sellRequest: createMockModel(),
    sellQuote: createMockModel(),
    review: createMockModel(),
    priceGuide: createMockModel(),
    priceHistory: createMockModel(),
    address: createMockModel(),
    tenant: createMockModel(),
    userTenant: createMockModel(),
    content: createMockModel(),
    banner: createMockModel(),
    executeInTransaction: jest.fn((fn) => fn(mock)),
    $transaction: jest.fn(),
  };

  return mock as any;
}
