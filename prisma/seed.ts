import { PrismaClient, DeviceCategory, Brand, ProductGrade, ProductStatus, PriceTrend, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = 'default-tenant';

async function main() {
  console.log('🌱 Seeding database...');

  // 0. 기본 테넌트 생성
  console.log('🏢 Creating default tenant...');
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'phonegabi' },
    update: {},
    create: {
      id: DEFAULT_TENANT_ID,
      name: '폰가비',
      slug: 'phonegabi',
      settings: {},
    },
  });

  // 1. 카테고리 생성
  console.log('📦 Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { type: DeviceCategory.SMARTPHONE },
      update: {},
      create: {
        type: DeviceCategory.SMARTPHONE,
        name: '스마트폰',
        description: '아이폰, 갤럭시 등 스마트폰',
        icon: 'smartphone',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { type: DeviceCategory.TABLET },
      update: {},
      create: {
        type: DeviceCategory.TABLET,
        name: '태블릿',
        description: '아이패드, 갤럭시탭 등 태블릿',
        icon: 'tablet',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { type: DeviceCategory.WATCH },
      update: {},
      create: {
        type: DeviceCategory.WATCH,
        name: '스마트워치',
        description: '애플워치, 갤럭시워치 등',
        icon: 'watch',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { type: DeviceCategory.LAPTOP },
      update: {},
      create: {
        type: DeviceCategory.LAPTOP,
        name: '노트북',
        description: '맥북, LG그램 등 노트북',
        icon: 'laptop',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { type: DeviceCategory.EARPHONE },
      update: {},
      create: {
        type: DeviceCategory.EARPHONE,
        name: '무선이어폰',
        description: '에어팟, 갤럭시버즈 등',
        icon: 'headphones',
        sortOrder: 5,
      },
    }),
  ]);

  const smartphoneCategory = categories[0];
  const tabletCategory = categories[1];
  const watchCategory = categories[2];

  // 2. 기기 모델 생성
  console.log('📱 Creating device models...');

  // iPhone 모델
  const iphone15Pro = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.APPLE, name: '아이폰 15 Pro' } },
    update: {},
    create: {
      categoryId: smartphoneCategory.id,
      brand: Brand.APPLE,
      name: '아이폰 15 Pro',
      series: '15 시리즈',
      releaseDate: new Date('2023-09-22'),
    },
  });

  const iphone15ProMax = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.APPLE, name: '아이폰 15 Pro Max' } },
    update: {},
    create: {
      categoryId: smartphoneCategory.id,
      brand: Brand.APPLE,
      name: '아이폰 15 Pro Max',
      series: '15 시리즈',
      releaseDate: new Date('2023-09-22'),
    },
  });

  const iphone14Pro = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.APPLE, name: '아이폰 14 Pro' } },
    update: {},
    create: {
      categoryId: smartphoneCategory.id,
      brand: Brand.APPLE,
      name: '아이폰 14 Pro',
      series: '14 시리즈',
      releaseDate: new Date('2022-09-16'),
    },
  });

  // Galaxy 모델
  const galaxyS24Ultra = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.SAMSUNG, name: '갤럭시 S24 Ultra' } },
    update: {},
    create: {
      categoryId: smartphoneCategory.id,
      brand: Brand.SAMSUNG,
      name: '갤럭시 S24 Ultra',
      series: 'S24 시리즈',
      releaseDate: new Date('2024-01-31'),
    },
  });

  const galaxyZFold5 = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.SAMSUNG, name: '갤럭시 Z 폴드5' } },
    update: {},
    create: {
      categoryId: smartphoneCategory.id,
      brand: Brand.SAMSUNG,
      name: '갤럭시 Z 폴드5',
      series: 'Z 폴드 시리즈',
      releaseDate: new Date('2023-08-11'),
    },
  });

  // iPad 모델
  const iPadPro12 = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.APPLE, name: '아이패드 Pro 12.9 (6세대)' } },
    update: {},
    create: {
      categoryId: tabletCategory.id,
      brand: Brand.APPLE,
      name: '아이패드 Pro 12.9 (6세대)',
      series: 'Pro 시리즈',
      releaseDate: new Date('2022-10-26'),
    },
  });

  // Apple Watch 모델
  const appleWatch9 = await prisma.deviceModel.upsert({
    where: { brand_name: { brand: Brand.APPLE, name: '애플워치 Series 9' } },
    update: {},
    create: {
      categoryId: watchCategory.id,
      brand: Brand.APPLE,
      name: '애플워치 Series 9',
      series: 'Series 9',
      releaseDate: new Date('2023-09-22'),
    },
  });

  // 3. 모델 변형 (용량, 색상) 생성
  console.log('🎨 Creating model variants...');

  const iPhone15ProVariants = await Promise.all([
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: iphone15Pro.id, storage: '128GB', color: '내추럴 티타늄' } },
      update: {},
      create: { modelId: iphone15Pro.id, storage: '128GB', color: '내추럴 티타늄', originalMsrp: 1550000 },
    }),
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: iphone15Pro.id, storage: '256GB', color: '내추럴 티타늄' } },
      update: {},
      create: { modelId: iphone15Pro.id, storage: '256GB', color: '내추럴 티타늄', originalMsrp: 1700000 },
    }),
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: iphone15Pro.id, storage: '512GB', color: '내추럴 티타늄' } },
      update: {},
      create: { modelId: iphone15Pro.id, storage: '512GB', color: '내추럴 티타늄', originalMsrp: 2000000 },
    }),
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: iphone15Pro.id, storage: '256GB', color: '블루 티타늄' } },
      update: {},
      create: { modelId: iphone15Pro.id, storage: '256GB', color: '블루 티타늄', originalMsrp: 1700000 },
    }),
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: iphone15Pro.id, storage: '256GB', color: '화이트 티타늄' } },
      update: {},
      create: { modelId: iphone15Pro.id, storage: '256GB', color: '화이트 티타늄', originalMsrp: 1700000 },
    }),
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: iphone15Pro.id, storage: '256GB', color: '블랙 티타늄' } },
      update: {},
      create: { modelId: iphone15Pro.id, storage: '256GB', color: '블랙 티타늄', originalMsrp: 1700000 },
    }),
  ]);

  const galaxyS24UltraVariants = await Promise.all([
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: galaxyS24Ultra.id, storage: '256GB', color: '티타늄 그레이' } },
      update: {},
      create: { modelId: galaxyS24Ultra.id, storage: '256GB', color: '티타늄 그레이', originalMsrp: 1698400 },
    }),
    prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: galaxyS24Ultra.id, storage: '512GB', color: '티타늄 그레이' } },
      update: {},
      create: { modelId: galaxyS24Ultra.id, storage: '512GB', color: '티타늄 그레이', originalMsrp: 1852500 },
    }),
  ]);

  // 4. 시세 정보 생성
  console.log('💰 Creating price guides...');

  const grades = [ProductGrade.S_PLUS, ProductGrade.S, ProductGrade.A, ProductGrade.B_PLUS, ProductGrade.B];
  const storages = ['128GB', '256GB', '512GB'];

  // iPhone 15 Pro 시세
  for (const storage of storages) {
    for (const grade of grades) {
      let basePrice = storage === '128GB' ? 1200000 : storage === '256GB' ? 1350000 : 1600000;

      // 등급별 감가
      if (grade === ProductGrade.S) basePrice *= 0.95;
      else if (grade === ProductGrade.A) basePrice *= 0.88;
      else if (grade === ProductGrade.B_PLUS) basePrice *= 0.82;
      else if (grade === ProductGrade.B) basePrice *= 0.75;

      await prisma.priceGuide.upsert({
        where: { modelId_storage_grade: { modelId: iphone15Pro.id, storage, grade } },
        update: { price: Math.round(basePrice), trend: PriceTrend.STABLE },
        create: {
          modelId: iphone15Pro.id,
          storage,
          grade,
          price: Math.round(basePrice),
          trend: PriceTrend.STABLE,
        },
      });
    }
  }

  // Galaxy S24 Ultra 시세
  for (const storage of ['256GB', '512GB']) {
    for (const grade of grades) {
      let basePrice = storage === '256GB' ? 1400000 : 1550000;

      if (grade === ProductGrade.S) basePrice *= 0.95;
      else if (grade === ProductGrade.A) basePrice *= 0.88;
      else if (grade === ProductGrade.B_PLUS) basePrice *= 0.82;
      else if (grade === ProductGrade.B) basePrice *= 0.75;

      await prisma.priceGuide.upsert({
        where: { modelId_storage_grade: { modelId: galaxyS24Ultra.id, storage, grade } },
        update: { price: Math.round(basePrice), trend: PriceTrend.UP },
        create: {
          modelId: galaxyS24Ultra.id,
          storage,
          grade,
          price: Math.round(basePrice),
          trend: PriceTrend.UP,
        },
      });
    }
  }

  // 5. 샘플 상품 생성
  console.log('🛍️ Creating sample products...');

  await prisma.product.upsert({
    where: { imei: '352918114359485' },
    update: { status: ProductStatus.AVAILABLE },
    create: {
      tenantId: DEFAULT_TENANT_ID,
      categoryId: smartphoneCategory.id,
      modelId: iphone15Pro.id,
      variantId: iPhone15ProVariants[1].id, // 256GB 내추럴 티타늄
      grade: ProductGrade.S_PLUS,
      sellingPrice: 1350000,
      batteryHealth: 100,
      warrantyExpiry: new Date('2024-09-22'),
      manufactureDate: new Date('2023-09-01'),
      imei: '352918114359485',
      description: '풀박스 미개봉급 상품입니다. 액정 기스 없음, 측면 테두리 매우 깨끗함.',
      images: ['/images/products/iphone15pro-1.jpg', '/images/products/iphone15pro-2.jpg'],
      rating: 5.0,
    },
  });

  await prisma.product.upsert({
    where: { imei: '352918114359486' },
    update: { status: ProductStatus.AVAILABLE },
    create: {
      tenantId: DEFAULT_TENANT_ID,
      categoryId: smartphoneCategory.id,
      modelId: iphone15Pro.id,
      variantId: iPhone15ProVariants[3].id, // 256GB 블루 티타늄
      grade: ProductGrade.A,
      sellingPrice: 1180000,
      batteryHealth: 95,
      manufactureDate: new Date('2023-10-15'),
      imei: '352918114359486',
      description: '사용감 있으나 상태 양호합니다. 액정 미세기스, 측면 미세 사용흔적.',
      images: ['/images/products/iphone15pro-blue-1.jpg'],
      rating: 4.8,
    },
  });

  await prisma.product.upsert({
    where: { imei: '352918114359487' },
    update: { status: ProductStatus.AVAILABLE },
    create: {
      tenantId: DEFAULT_TENANT_ID,
      categoryId: smartphoneCategory.id,
      modelId: galaxyS24Ultra.id,
      variantId: galaxyS24UltraVariants[0].id,
      grade: ProductGrade.S,
      sellingPrice: 1420000,
      batteryHealth: 98,
      manufactureDate: new Date('2024-02-01'),
      imei: '352918114359487',
      description: '거의 새제품급 상품입니다. S펜 포함, 정품 케이스 포함.',
      images: ['/images/products/s24ultra-1.jpg'],
      rating: 4.9,
    },
  });

  // 6. 관리자 계정 생성
  console.log('👤 Creating admin user...');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@phonegabi.com' },
    update: {},
    create: {
      email: 'admin@phonegabi.com',
      password: hashedPassword,
      name: '관리자',
      phone: '010-0000-0000',
      role: UserRole.SUPER_ADMIN,
    },
  });

  // 테스트 사용자 생성
  const testUserPassword = await bcrypt.hash('Test123!', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testUserPassword,
      name: '테스트 사용자',
      phone: '010-1234-5678',
      role: UserRole.USER,
    },
  });

  // 7. UserTenant 할당
  console.log('🔗 Assigning users to default tenant...');

  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: DEFAULT_TENANT_ID } },
    update: {},
    create: {
      userId: adminUser.id,
      tenantId: DEFAULT_TENANT_ID,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: testUser.id, tenantId: DEFAULT_TENANT_ID } },
    update: {},
    create: {
      userId: testUser.id,
      tenantId: DEFAULT_TENANT_ID,
      role: UserRole.USER,
    },
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
