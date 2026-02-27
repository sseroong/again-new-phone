import { PrismaClient, DeviceCategory, Brand, ProductGrade, ProductStatus, PriceTrend, UserRole, ContentType, ContentStatus, BannerPosition } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_TENANT_ID = 'default-tenant';

// ========== Unsplash 이미지 URL (카테고리별) ==========
const PHONE_IMAGES = [
  'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1580910051074-3eb694886571?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1591337676887-a217a6c8c8d4?w=600&h=600&fit=crop',
];

const TABLET_IMAGES = [
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1561154464-82e9aeb93fe5?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1632882765546-1ee75f53becb?w=600&h=600&fit=crop',
];

const WATCH_IMAGES = [
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=600&h=600&fit=crop',
];

const LAPTOP_IMAGES = [
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&h=600&fit=crop',
];

const EARPHONE_IMAGES = [
  'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&h=600&fit=crop',
];

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
  const laptopCategory = categories[3];
  const earphoneCategory = categories[4];

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

  // 5. 샘플 상품 생성 (기존 3개 + 신규 47개 = 총 50개)
  console.log('🛍️ Creating 50 sample products...');

  // 기존 3개 상품 (이미지 업데이트)
  await prisma.product.upsert({
    where: { imei: '352918114359485' },
    update: { status: ProductStatus.AVAILABLE, images: [PHONE_IMAGES[0], PHONE_IMAGES[1]] },
    create: {
      tenantId: DEFAULT_TENANT_ID,
      categoryId: smartphoneCategory.id,
      modelId: iphone15Pro.id,
      variantId: iPhone15ProVariants[1].id,
      grade: ProductGrade.S_PLUS,
      sellingPrice: 1350000,
      batteryHealth: 100,
      warrantyExpiry: new Date('2024-09-22'),
      manufactureDate: new Date('2023-09-01'),
      imei: '352918114359485',
      description: '풀박스 미개봉급 상품입니다. 액정 기스 없음, 측면 테두리 매우 깨끗함.',
      images: [PHONE_IMAGES[0], PHONE_IMAGES[1]],
      rating: 5.0,
    },
  });

  await prisma.product.upsert({
    where: { imei: '352918114359486' },
    update: { status: ProductStatus.AVAILABLE, images: [PHONE_IMAGES[2]] },
    create: {
      tenantId: DEFAULT_TENANT_ID,
      categoryId: smartphoneCategory.id,
      modelId: iphone15Pro.id,
      variantId: iPhone15ProVariants[3].id,
      grade: ProductGrade.A,
      sellingPrice: 1180000,
      batteryHealth: 95,
      manufactureDate: new Date('2023-10-15'),
      imei: '352918114359486',
      description: '사용감 있으나 상태 양호합니다. 액정 미세기스, 측면 미세 사용흔적.',
      images: [PHONE_IMAGES[2]],
      rating: 4.8,
    },
  });

  await prisma.product.upsert({
    where: { imei: '352918114359487' },
    update: { status: ProductStatus.AVAILABLE, images: [PHONE_IMAGES[3]] },
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
      images: [PHONE_IMAGES[3]],
      rating: 4.9,
    },
  });

  // ========== 신규 47개 상품 추가 ==========

  // 헬퍼: 모델 → 변형 → 상품 일괄 생성
  async function createProduct(opts: {
    id: string;
    categoryId: string;
    brand: Brand;
    modelName: string;
    series: string;
    releaseDate: string;
    storage: string;
    color: string;
    msrp: number;
    grade: ProductGrade;
    sellingPrice: number;
    batteryHealth: number | null;
    description: string;
    images: string[];
  }) {
    const model = await prisma.deviceModel.upsert({
      where: { brand_name: { brand: opts.brand, name: opts.modelName } },
      update: {},
      create: {
        categoryId: opts.categoryId,
        brand: opts.brand,
        name: opts.modelName,
        series: opts.series,
        releaseDate: new Date(opts.releaseDate),
      },
    });

    const variant = await prisma.modelVariant.upsert({
      where: { modelId_storage_color: { modelId: model.id, storage: opts.storage, color: opts.color } },
      update: {},
      create: { modelId: model.id, storage: opts.storage, color: opts.color, originalMsrp: opts.msrp },
    });

    await prisma.product.upsert({
      where: { id: opts.id },
      update: { images: opts.images },
      create: {
        id: opts.id,
        tenantId: DEFAULT_TENANT_ID,
        categoryId: opts.categoryId,
        modelId: model.id,
        variantId: variant.id,
        grade: opts.grade,
        sellingPrice: opts.sellingPrice,
        batteryHealth: opts.batteryHealth,
        description: opts.description,
        images: opts.images,
        rating: parseFloat((4.3 + Math.random() * 0.7).toFixed(1)),
      },
    });
  }

  // ----- 스마트폰 추가 7개 (기존 3개 + 7개 = 10개) -----
  console.log('  📱 스마트폰 추가...');

  await createProduct({
    id: 'seed-phone-04',
    categoryId: smartphoneCategory.id,
    brand: Brand.APPLE, modelName: '아이폰 15 Pro Max', series: '15 시리즈', releaseDate: '2023-09-22',
    storage: '256GB', color: '내추럴 티타늄', msrp: 1900000,
    grade: ProductGrade.S_PLUS, sellingPrice: 1500000, batteryHealth: 100,
    description: '미개봉급 최상 상태. 풀박스 구성품 완비, 액정/외관 기스 전무.',
    images: [PHONE_IMAGES[4], PHONE_IMAGES[0]],
  });

  await createProduct({
    id: 'seed-phone-05',
    categoryId: smartphoneCategory.id,
    brand: Brand.APPLE, modelName: '아이폰 15', series: '15 시리즈', releaseDate: '2023-09-22',
    storage: '256GB', color: '블루', msrp: 1350000,
    grade: ProductGrade.A, sellingPrice: 850000, batteryHealth: 93,
    description: '전체적으로 깨끗한 상태. 액정 미세 스크래치 1~2개, 측면 양호.',
    images: [PHONE_IMAGES[5]],
  });

  await createProduct({
    id: 'seed-phone-06',
    categoryId: smartphoneCategory.id,
    brand: Brand.APPLE, modelName: '아이폰 14', series: '14 시리즈', releaseDate: '2022-09-16',
    storage: '128GB', color: '미드나이트', msrp: 1250000,
    grade: ProductGrade.B_PLUS, sellingPrice: 550000, batteryHealth: 88,
    description: '사용감 있으나 정상 작동. 액정 미세 기스, 측면 약간의 사용흔적.',
    images: [PHONE_IMAGES[0], PHONE_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-phone-07',
    categoryId: smartphoneCategory.id,
    brand: Brand.APPLE, modelName: '아이폰 13', series: '13 시리즈', releaseDate: '2021-09-24',
    storage: '128GB', color: '스타라이트', msrp: 1090000,
    grade: ProductGrade.B, sellingPrice: 430000, batteryHealth: 85,
    description: '사용감 보통. 액정 경미한 기스, 후면 미세 스크래치. 기능 이상 없음.',
    images: [PHONE_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-phone-08',
    categoryId: smartphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 S24+', series: 'S24 시리즈', releaseDate: '2024-01-31',
    storage: '256GB', color: '앰버 옐로우', msrp: 1353000,
    grade: ProductGrade.A, sellingPrice: 780000, batteryHealth: 96,
    description: '상태 양호. AI 기능 탑재, 액정/외관 깨끗함. 정품 충전기 포함.',
    images: [PHONE_IMAGES[3], PHONE_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-phone-09',
    categoryId: smartphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Z 플립5', series: 'Z 플립 시리즈', releaseDate: '2023-08-11',
    storage: '256GB', color: '민트', msrp: 1399200,
    grade: ProductGrade.S, sellingPrice: 800000, batteryHealth: 97,
    description: '거의 새것 같은 상태. 폴딩 화면 주름 최소, 외관 기스 없음.',
    images: [PHONE_IMAGES[5]],
  });

  await createProduct({
    id: 'seed-phone-10',
    categoryId: smartphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 S23 Ultra', series: 'S23 시리즈', releaseDate: '2023-02-17',
    storage: '256GB', color: '팬텀 블랙', msrp: 1599400,
    grade: ProductGrade.B_PLUS, sellingPrice: 700000, batteryHealth: 90,
    description: '사용감 있으나 기능 완벽. S펜 포함, 액정 보호필름 부착 상태.',
    images: [PHONE_IMAGES[0]],
  });

  // ----- 태블릿 10개 -----
  console.log('  📱 태블릿 추가...');

  await createProduct({
    id: 'seed-tablet-01',
    categoryId: tabletCategory.id,
    brand: Brand.APPLE, modelName: '아이패드 Pro 12.9 M2', series: 'Pro 시리즈', releaseDate: '2022-10-26',
    storage: '256GB', color: '스페이스 그레이', msrp: 1729000,
    grade: ProductGrade.S, sellingPrice: 1100000, batteryHealth: 96,
    description: 'M2 칩 탑재 최고 성능. 액정 기스 없음, 외관 매우 깨끗.',
    images: [TABLET_IMAGES[0], TABLET_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-tablet-02',
    categoryId: tabletCategory.id,
    brand: Brand.APPLE, modelName: '아이패드 Air 5', series: 'Air 시리즈', releaseDate: '2022-03-18',
    storage: '64GB', color: '블루', msrp: 929000,
    grade: ProductGrade.A, sellingPrice: 520000, batteryHealth: 92,
    description: 'M1 칩 탑재. 전체적으로 깨끗, 측면 미세 사용흔적.',
    images: [TABLET_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-tablet-03',
    categoryId: tabletCategory.id,
    brand: Brand.APPLE, modelName: '아이패드 10세대', series: '기본 시리즈', releaseDate: '2022-10-26',
    storage: '64GB', color: '실버', msrp: 679000,
    grade: ProductGrade.S, sellingPrice: 380000, batteryHealth: 94,
    description: 'USB-C 탑재 모델. 깨끗한 상태, 학생용으로 추천.',
    images: [TABLET_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-tablet-04',
    categoryId: tabletCategory.id,
    brand: Brand.APPLE, modelName: '아이패드 mini 6', series: 'mini 시리즈', releaseDate: '2021-09-24',
    storage: '64GB', color: '스타라이트', msrp: 649000,
    grade: ProductGrade.A, sellingPrice: 400000, batteryHealth: 90,
    description: '컴팩트 사이즈, 휴대성 최고. 액정 양호, 소형 기스 1~2개.',
    images: [TABLET_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-tablet-05',
    categoryId: tabletCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Tab S9 Ultra', series: 'Tab S9 시리즈', releaseDate: '2023-08-11',
    storage: '256GB', color: '그래파이트', msrp: 1599000,
    grade: ProductGrade.S_PLUS, sellingPrice: 950000, batteryHealth: 98,
    description: '14.6인치 대화면. 미개봉급 최상 상태, S펜 포함.',
    images: [TABLET_IMAGES[0], TABLET_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-tablet-06',
    categoryId: tabletCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Tab S9+', series: 'Tab S9 시리즈', releaseDate: '2023-08-11',
    storage: '256GB', color: '그래파이트', msrp: 1299000,
    grade: ProductGrade.A, sellingPrice: 650000, batteryHealth: 93,
    description: '12.4인치 AMOLED. 전체적으로 깨끗한 상태.',
    images: [TABLET_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-tablet-07',
    categoryId: tabletCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Tab S9', series: 'Tab S9 시리즈', releaseDate: '2023-08-11',
    storage: '128GB', color: '그래파이트', msrp: 999000,
    grade: ProductGrade.B_PLUS, sellingPrice: 480000, batteryHealth: 91,
    description: '11인치 기본형. 사용감 약간 있으나 기능 정상, S펜 포함.',
    images: [TABLET_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-tablet-08',
    categoryId: tabletCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Tab S8', series: 'Tab S8 시리즈', releaseDate: '2022-02-25',
    storage: '128GB', color: '실버', msrp: 899000,
    grade: ProductGrade.B, sellingPrice: 350000, batteryHealth: 87,
    description: '전세대 모델. 사용감 있으나 기본 성능 충분.',
    images: [TABLET_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-tablet-09',
    categoryId: tabletCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Tab A9', series: 'Tab A 시리즈', releaseDate: '2023-11-01',
    storage: '64GB', color: '그래파이트', msrp: 299000,
    grade: ProductGrade.NEW, sellingPrice: 200000, batteryHealth: 100,
    description: '미개봉 새상품. 가성비 태블릿, 기본 용도에 적합.',
    images: [TABLET_IMAGES[0]],
  });

  await createProduct({
    id: 'seed-tablet-10',
    categoryId: tabletCategory.id,
    brand: Brand.LENOVO, modelName: '레노버 Tab P11 Pro', series: 'Tab P 시리즈', releaseDate: '2022-01-10',
    storage: '128GB', color: '슬레이트 그레이', msrp: 499000,
    grade: ProductGrade.A, sellingPrice: 280000, batteryHealth: 89,
    description: 'OLED 디스플레이. 영상 감상용으로 추천, 상태 양호.',
    images: [TABLET_IMAGES[1]],
  });

  // ----- 스마트워치 10개 -----
  console.log('  ⌚ 스마트워치 추가...');

  await createProduct({
    id: 'seed-watch-01',
    categoryId: watchCategory.id,
    brand: Brand.APPLE, modelName: '애플워치 Ultra 2', series: 'Ultra 시리즈', releaseDate: '2023-09-22',
    storage: '64GB', color: '티타늄', msrp: 1149000,
    grade: ProductGrade.S_PLUS, sellingPrice: 750000, batteryHealth: 99,
    description: '49mm 티타늄 케이스. 미개봉급, 스포츠 밴드 포함.',
    images: [WATCH_IMAGES[0], WATCH_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-watch-02',
    categoryId: watchCategory.id,
    brand: Brand.APPLE, modelName: '애플워치 Series 9', series: 'Series 9', releaseDate: '2023-09-22',
    storage: '64GB', color: '미드나이트', msrp: 599000,
    grade: ProductGrade.S, sellingPrice: 380000, batteryHealth: 97,
    description: '45mm 알루미늄 케이스. 거의 새것, 더블탭 기능 지원.',
    images: [WATCH_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-watch-03',
    categoryId: watchCategory.id,
    brand: Brand.APPLE, modelName: '애플워치 SE 2', series: 'SE 시리즈', releaseDate: '2022-09-16',
    storage: '32GB', color: '스타라이트', msrp: 359000,
    grade: ProductGrade.A, sellingPrice: 220000, batteryHealth: 92,
    description: '44mm 가성비 모델. 상태 양호, 스포츠 밴드 포함.',
    images: [WATCH_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-watch-04',
    categoryId: watchCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 워치6 Classic', series: '워치6 시리즈', releaseDate: '2023-08-11',
    storage: '16GB', color: '실버', msrp: 499000,
    grade: ProductGrade.S, sellingPrice: 280000, batteryHealth: 95,
    description: '47mm 회전 베젤. 클래식 디자인, 깨끗한 상태.',
    images: [WATCH_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-watch-05',
    categoryId: watchCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 워치6', series: '워치6 시리즈', releaseDate: '2023-08-11',
    storage: '16GB', color: '그래파이트', msrp: 349000,
    grade: ProductGrade.A, sellingPrice: 180000, batteryHealth: 93,
    description: '44mm 경량 모델. 건강 모니터링 기능, 양호한 상태.',
    images: [WATCH_IMAGES[0]],
  });

  await createProduct({
    id: 'seed-watch-06',
    categoryId: watchCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 워치5 Pro', series: '워치5 시리즈', releaseDate: '2022-08-26',
    storage: '16GB', color: '블랙 티타늄', msrp: 549000,
    grade: ProductGrade.B_PLUS, sellingPrice: 200000, batteryHealth: 88,
    description: '45mm 티타늄 케이스. 아웃도어용, 사용감 약간 있음.',
    images: [WATCH_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-watch-07',
    categoryId: watchCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 워치5', series: '워치5 시리즈', releaseDate: '2022-08-26',
    storage: '16GB', color: '실버', msrp: 349000,
    grade: ProductGrade.B, sellingPrice: 130000, batteryHealth: 85,
    description: '44mm 기본형. 사용감 보통이나 기능 정상 작동.',
    images: [WATCH_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-watch-08',
    categoryId: watchCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 워치4 Classic', series: '워치4 시리즈', releaseDate: '2021-08-27',
    storage: '16GB', color: '블랙', msrp: 429000,
    grade: ProductGrade.B, sellingPrice: 120000, batteryHealth: 82,
    description: '46mm 회전 베젤. 전세대 모델, 기본 기능 충실.',
    images: [WATCH_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-watch-09',
    categoryId: watchCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 워치4', series: '워치4 시리즈', releaseDate: '2021-08-27',
    storage: '16GB', color: '그린', msrp: 299000,
    grade: ProductGrade.B_PLUS, sellingPrice: 100000, batteryHealth: 86,
    description: '44mm 경량. 체성분 측정 가능, 미세 사용흔적.',
    images: [WATCH_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-watch-10',
    categoryId: watchCategory.id,
    brand: Brand.APPLE, modelName: '애플워치 Series 8', series: 'Series 8', releaseDate: '2022-09-16',
    storage: '32GB', color: '미드나이트', msrp: 599000,
    grade: ProductGrade.A, sellingPrice: 300000, batteryHealth: 91,
    description: '45mm 알루미늄. 충돌 감지 기능, 상태 양호.',
    images: [WATCH_IMAGES[0], WATCH_IMAGES[2]],
  });

  // ----- 노트북 10개 -----
  console.log('  💻 노트북 추가...');

  await createProduct({
    id: 'seed-laptop-01',
    categoryId: laptopCategory.id,
    brand: Brand.APPLE, modelName: 'MacBook Pro 16인치 M3 Pro', series: 'MacBook Pro', releaseDate: '2023-11-07',
    storage: '512GB', color: '스페이스 블랙', msrp: 3490000,
    grade: ProductGrade.S_PLUS, sellingPrice: 2800000, batteryHealth: null,
    description: 'M3 Pro 칩, 18GB RAM. 미개봉급 상태, 충전 사이클 15회 미만.',
    images: [LAPTOP_IMAGES[0], LAPTOP_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-laptop-02',
    categoryId: laptopCategory.id,
    brand: Brand.APPLE, modelName: 'MacBook Pro 14인치 M3', series: 'MacBook Pro', releaseDate: '2023-11-07',
    storage: '512GB', color: '스페이스 그레이', msrp: 2390000,
    grade: ProductGrade.S, sellingPrice: 2100000, batteryHealth: null,
    description: 'M3 칩, 8GB RAM. 거의 새것, 충전 사이클 30회 미만.',
    images: [LAPTOP_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-laptop-03',
    categoryId: laptopCategory.id,
    brand: Brand.APPLE, modelName: 'MacBook Air 15인치 M2', series: 'MacBook Air', releaseDate: '2023-06-13',
    storage: '256GB', color: '스타라이트', msrp: 1890000,
    grade: ProductGrade.A, sellingPrice: 1350000, batteryHealth: null,
    description: '15인치 대화면. 상태 양호, 키보드 마모 없음.',
    images: [LAPTOP_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-laptop-04',
    categoryId: laptopCategory.id,
    brand: Brand.APPLE, modelName: 'MacBook Air 13인치 M2', series: 'MacBook Air', releaseDate: '2022-07-15',
    storage: '256GB', color: '미드나이트', msrp: 1590000,
    grade: ProductGrade.A, sellingPrice: 1050000, batteryHealth: null,
    description: 'M2 칩 탑재. 깨끗한 상태, 가벼운 일상용으로 추천.',
    images: [LAPTOP_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-laptop-05',
    categoryId: laptopCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Book3 Pro 360', series: 'Book3 시리즈', releaseDate: '2023-02-17',
    storage: '512GB', color: '그래파이트', msrp: 1999000,
    grade: ProductGrade.S, sellingPrice: 1200000, batteryHealth: null,
    description: '360도 회전 AMOLED. S펜 지원, 깨끗한 상태.',
    images: [LAPTOP_IMAGES[0]],
  });

  await createProduct({
    id: 'seed-laptop-06',
    categoryId: laptopCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 Book3 Ultra', series: 'Book3 시리즈', releaseDate: '2023-02-17',
    storage: '512GB', color: '그래파이트', msrp: 2990000,
    grade: ProductGrade.B_PLUS, sellingPrice: 1400000, batteryHealth: null,
    description: 'i9 + RTX4070. 사용감 약간 있으나 고성능 유지.',
    images: [LAPTOP_IMAGES[1], LAPTOP_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-laptop-07',
    categoryId: laptopCategory.id,
    brand: Brand.LG, modelName: 'LG gram 17', series: 'gram 시리즈', releaseDate: '2023-02-01',
    storage: '512GB', color: '차콜 그레이', msrp: 1990000,
    grade: ProductGrade.A, sellingPrice: 1100000, batteryHealth: null,
    description: '17인치 초경량 1.35kg. 상태 양호, 배터리 성능 우수.',
    images: [LAPTOP_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-laptop-08',
    categoryId: laptopCategory.id,
    brand: Brand.LG, modelName: 'LG gram 16', series: 'gram 시리즈', releaseDate: '2023-02-01',
    storage: '256GB', color: '화이트', msrp: 1590000,
    grade: ProductGrade.B_PLUS, sellingPrice: 800000, batteryHealth: null,
    description: '16인치 경량 노트북. 키보드 약간 마모, 액정 깨끗.',
    images: [LAPTOP_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-laptop-09',
    categoryId: laptopCategory.id,
    brand: Brand.LENOVO, modelName: 'ThinkPad X1 Carbon Gen 11', series: 'ThinkPad 시리즈', releaseDate: '2023-03-01',
    storage: '256GB', color: '블랙', msrp: 1990000,
    grade: ProductGrade.B, sellingPrice: 700000, batteryHealth: null,
    description: '비즈니스 노트북. 사용감 있으나 내구성 우수, 키보드 양호.',
    images: [LAPTOP_IMAGES[0]],
  });

  await createProduct({
    id: 'seed-laptop-10',
    categoryId: laptopCategory.id,
    brand: Brand.LENOVO, modelName: 'IdeaPad Slim 5', series: 'IdeaPad 시리즈', releaseDate: '2023-06-01',
    storage: '256GB', color: '클라우드 그레이', msrp: 899000,
    grade: ProductGrade.UNOPENED, sellingPrice: 650000, batteryHealth: null,
    description: '미개봉 새상품. 가성비 노트북, 일상 업무용 추천.',
    images: [LAPTOP_IMAGES[1]],
  });

  // ----- 무선이어폰 10개 -----
  console.log('  🎧 무선이어폰 추가...');

  await createProduct({
    id: 'seed-earphone-01',
    categoryId: earphoneCategory.id,
    brand: Brand.APPLE, modelName: '에어팟 Pro 2', series: 'AirPods 시리즈', releaseDate: '2022-09-23',
    storage: '기본', color: '화이트', msrp: 359000,
    grade: ProductGrade.S_PLUS, sellingPrice: 250000, batteryHealth: null,
    description: '노이즈 캔슬링 최강. 미개봉급 상태, 이어팁 미사용.',
    images: [EARPHONE_IMAGES[0], EARPHONE_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-earphone-02',
    categoryId: earphoneCategory.id,
    brand: Brand.APPLE, modelName: '에어팟 3세대', series: 'AirPods 시리즈', releaseDate: '2021-10-26',
    storage: '기본', color: '화이트', msrp: 259000,
    grade: ProductGrade.A, sellingPrice: 130000, batteryHealth: null,
    description: '공간 음향 지원. 상태 양호, 충전 케이스 포함.',
    images: [EARPHONE_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-earphone-03',
    categoryId: earphoneCategory.id,
    brand: Brand.APPLE, modelName: '에어팟 Max', series: 'AirPods 시리즈', releaseDate: '2020-12-15',
    storage: '기본', color: '스페이스 그레이', msrp: 769000,
    grade: ProductGrade.S, sellingPrice: 450000, batteryHealth: null,
    description: '프리미엄 오버이어. 거의 새것, 스마트 케이스 포함.',
    images: [EARPHONE_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-earphone-04',
    categoryId: earphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 버즈2 Pro', series: '갤럭시 버즈 시리즈', releaseDate: '2022-08-26',
    storage: '기본', color: '그래파이트', msrp: 279000,
    grade: ProductGrade.A, sellingPrice: 100000, batteryHealth: null,
    description: '하이레졸루션 음질. 노이즈 캔슬링, 상태 양호.',
    images: [EARPHONE_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-earphone-05',
    categoryId: earphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 버즈 FE', series: '갤럭시 버즈 시리즈', releaseDate: '2023-10-05',
    storage: '기본', color: '그래파이트', msrp: 129000,
    grade: ProductGrade.S, sellingPrice: 50000, batteryHealth: null,
    description: '가성비 노캔 이어폰. 깨끗한 상태, 이어팁 여분 포함.',
    images: [EARPHONE_IMAGES[0]],
  });

  await createProduct({
    id: 'seed-earphone-06',
    categoryId: earphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 버즈2', series: '갤럭시 버즈 시리즈', releaseDate: '2022-02-25',
    storage: '기본', color: '올리브', msrp: 179000,
    grade: ProductGrade.B_PLUS, sellingPrice: 45000, batteryHealth: null,
    description: '경량 5g. 노이즈 캔슬링, 사용감 약간.',
    images: [EARPHONE_IMAGES[1]],
  });

  await createProduct({
    id: 'seed-earphone-07',
    categoryId: earphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 버즈 Pro', series: '갤럭시 버즈 시리즈', releaseDate: '2021-01-29',
    storage: '기본', color: '팬텀 블랙', msrp: 249000,
    grade: ProductGrade.B, sellingPrice: 40000, batteryHealth: null,
    description: '프로급 음질. 사용감 보통, 기능 정상 작동.',
    images: [EARPHONE_IMAGES[2]],
  });

  await createProduct({
    id: 'seed-earphone-08',
    categoryId: earphoneCategory.id,
    brand: Brand.SAMSUNG, modelName: '갤럭시 버즈 Live', series: '갤럭시 버즈 시리즈', releaseDate: '2020-08-06',
    storage: '기본', color: '미스틱 브론즈', msrp: 199000,
    grade: ProductGrade.B, sellingPrice: 30000, batteryHealth: null,
    description: '콩나물 디자인. 오픈형 착용감, 사용감 있음.',
    images: [EARPHONE_IMAGES[3]],
  });

  await createProduct({
    id: 'seed-earphone-09',
    categoryId: earphoneCategory.id,
    brand: Brand.LG, modelName: 'LG 톤프리 T90', series: 'TONE Free 시리즈', releaseDate: '2023-04-01',
    storage: '기본', color: '블랙', msrp: 279000,
    grade: ProductGrade.A, sellingPrice: 100000, batteryHealth: null,
    description: 'Dolby Atmos 지원. 자외선 살균 케이스, 상태 양호.',
    images: [EARPHONE_IMAGES[4]],
  });

  await createProduct({
    id: 'seed-earphone-10',
    categoryId: earphoneCategory.id,
    brand: Brand.APPLE, modelName: '에어팟 2세대', series: 'AirPods 시리즈', releaseDate: '2019-03-20',
    storage: '기본', color: '화이트', msrp: 199000,
    grade: ProductGrade.B, sellingPrice: 60000, batteryHealth: null,
    description: '기본 에어팟. 사용감 있으나 작동 정상, 충전 케이스 포함.',
    images: [EARPHONE_IMAGES[0]],
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

  // 8. CMS 콘텐츠 생성
  console.log('📝 Creating CMS contents...');

  // 공지사항
  await prisma.content.upsert({
    where: { id: 'notice-1' },
    update: {},
    create: {
      id: 'notice-1',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.NOTICE,
      status: ContentStatus.PUBLISHED,
      title: '딱내폰 서비스 오픈 안내',
      content: '안녕하세요, 딱내폰입니다.\n\n검증된 중고 전자기기 거래 플랫폼 딱내폰이 정식 오픈하였습니다.\n\n믿을 수 있는 품질 검수와 합리적인 가격으로 중고 기기를 거래해보세요.\n\n감사합니다.',
      authorId: adminUser.id,
      isPinned: true,
      sortOrder: 0,
      viewCount: 150,
    },
  });

  await prisma.content.upsert({
    where: { id: 'notice-2' },
    update: {},
    create: {
      id: 'notice-2',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.NOTICE,
      status: ContentStatus.PUBLISHED,
      title: '개인정보처리방침 변경 안내',
      content: '개인정보처리방침이 일부 변경되었습니다.\n\n변경 사항:\n- 개인정보 수집 항목 변경\n- 보유 기간 명시\n\n시행일: 2024년 3월 1일',
      authorId: adminUser.id,
      sortOrder: 1,
      viewCount: 45,
    },
  });

  await prisma.content.upsert({
    where: { id: 'notice-3' },
    update: {},
    create: {
      id: 'notice-3',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.NOTICE,
      status: ContentStatus.PUBLISHED,
      title: '설 연휴 배송 안내',
      content: '설 연휴 기간 배송이 일시 중단됩니다.\n\n중단 기간: 2024년 2월 9일 ~ 2월 12일\n연휴 이후 순차 배송됩니다.',
      authorId: adminUser.id,
      sortOrder: 2,
      viewCount: 78,
    },
  });

  // 이벤트
  await prisma.content.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.EVENT,
      status: ContentStatus.PUBLISHED,
      title: '오픈 기념 전 상품 10% 할인',
      content: '딱내폰 오픈을 기념하여 전 상품 10% 할인 이벤트를 진행합니다.\n기간 내 구매하시면 자동으로 할인이 적용됩니다.',
      thumbnail: 'https://placehold.co/600x400/3B82F6/white?text=OPEN+SALE',
      authorId: adminUser.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      sortOrder: 0,
      viewCount: 320,
    },
  });

  await prisma.content.upsert({
    where: { id: 'event-2' },
    update: {},
    create: {
      id: 'event-2',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.EVENT,
      status: ContentStatus.PUBLISHED,
      title: '중고폰 판매하면 추가 보너스 5만원',
      content: '기기를 판매 접수하시면 최종 매입가에 5만원 보너스를 추가 지급합니다.\n이벤트 기간 한정!',
      thumbnail: 'https://placehold.co/600x400/10B981/white?text=SELL+BONUS',
      authorId: adminUser.id,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-06-30'),
      sortOrder: 1,
      viewCount: 180,
    },
  });

  // FAQ
  const faqItems = [
    { category: 'buy', title: '중고폰 구매 시 보증은 어떻게 되나요?', answer: '모든 제품은 구매일로부터 30일간 무상 보증이 제공됩니다. 기기 불량이 발견될 경우 교환 또는 환불이 가능합니다. 단, 고객 과실로 인한 파손은 보증 대상에서 제외됩니다.' },
    { category: 'buy', title: '등급은 어떤 기준으로 나뉘나요?', answer: 'S등급은 사용감이 거의 없는 최상급, A등급은 외관과 액정이 깨끗한 양호 상태, B등급은 약간의 사용감이 있는 보통 상태, C등급은 외관 흠집이나 액정 흠집이 있는 상태, D등급은 기능 불량이나 외관 파손이 있는 하급 상태입니다.' },
    { category: 'buy', title: '배터리 효율은 어떻게 확인하나요?', answer: '모든 제품은 출고 전 배터리 효율을 측정하여 상품 상세 페이지에 표시합니다. iPhone의 경우 설정 > 배터리 > 배터리 성능 상태에서도 확인 가능합니다.' },
    { category: 'buy', title: '구매 후 마음에 들지 않으면 반품이 가능한가요?', answer: '구매일로부터 7일 이내에 반품 신청이 가능합니다. 제품 수령 후 사용하지 않은 상태여야 하며, 단순 변심에 의한 반품 시 왕복 배송비가 발생합니다.' },
    { category: 'sell', title: '판매 접수는 어떻게 하나요?', answer: '판매하기 페이지에서 기기 정보(모델, 용량, 색상)와 상태를 입력하면 예상 견적을 받을 수 있습니다. 견적에 동의하시면 택배 수거 또는 방문 수거를 선택하여 기기를 보내주시면 됩니다.' },
    { category: 'sell', title: '판매 대금은 언제 지급되나요?', answer: '기기 수령 후 1~2 영업일 내에 검수를 진행합니다. 검수 완료 후 최종 가격이 확정되면 등록하신 계좌로 당일 입금됩니다.' },
    { category: 'sell', title: '자가 등급 판정과 실제 등급이 다를 수 있나요?', answer: '네, 자가 등급은 참고용이며 실제 검수 결과에 따라 등급이 변경될 수 있습니다. 등급이 낮아지면 최종 가격이 조정될 수 있으며, 이 경우 판매 취소도 가능합니다.' },
    { category: 'sell', title: '초기화하지 않고 보내도 되나요?', answer: '가능하지만, 개인정보 보호를 위해 발송 전 공장 초기화를 권장합니다. 초기화하지 않은 기기는 저희가 안전하게 초기화 처리합니다.' },
    { category: 'payment', title: '어떤 결제 수단을 사용할 수 있나요?', answer: '신용카드, 체크카드, 계좌이체를 지원합니다. 토스페이먼츠를 통한 안전한 결제가 가능합니다.' },
    { category: 'payment', title: '할부 결제가 가능한가요?', answer: '신용카드 결제 시 2~12개월 할부가 가능합니다. 무이자 할부 이벤트는 카드사별로 다르며, 결제 시 안내됩니다.' },
    { category: 'payment', title: '결제 후 주문 취소가 가능한가요?', answer: '배송 전 주문 취소가 가능하며, 결제 금액은 카드사에 따라 3~7 영업일 내에 환불됩니다. 배송 중인 경우 상품 수령 후 반품 절차를 진행해주세요.' },
    { category: 'delivery', title: '배송은 얼마나 걸리나요?', answer: '결제 완료 후 1~2 영업일 내에 출고되며, 출고 후 1~2일 내에 수령 가능합니다. 도서산간 지역은 추가 1~2일이 소요될 수 있습니다.' },
    { category: 'delivery', title: '배송비는 얼마인가요?', answer: '구매 시 배송비는 무료입니다. 판매 시 택배 수거도 무료이며, 반품 시에는 왕복 배송비(5,000원)가 발생합니다.' },
    { category: 'delivery', title: '배송 추적은 어떻게 하나요?', answer: '출고 후 문자 또는 알림으로 송장번호를 안내드립니다. 나의 거래내역 페이지에서도 배송 상태를 확인할 수 있습니다.' },
    { category: 'etc', title: '반품 절차는 어떻게 되나요?', answer: '나의 거래내역에서 반품 신청을 하시면, 무료 수거 택배가 방문합니다. 제품 수거 후 검수를 진행하고, 환불 처리합니다.' },
    { category: 'etc', title: '환불은 얼마나 걸리나요?', answer: '제품 수거 후 검수 완료까지 1~2 영업일, 환불 처리 후 카드사에 따라 3~7 영업일이 소요됩니다. 계좌이체 결제의 경우 검수 완료 당일 환불됩니다.' },
    { category: 'etc', title: '부분 환불이 가능한가요?', answer: '여러 상품을 한 번에 구매한 경우 개별 상품 단위로 반품 및 환불이 가능합니다.' },
    { category: 'etc', title: '수령한 제품에 문제가 있을 경우 어떻게 하나요?', answer: '상품 상세 페이지에 기재된 내용과 다르거나 미고지 불량이 있는 경우, 수령일로부터 30일 이내에 무상 교환 또는 환불이 가능합니다. 고객센터로 연락해주세요.' },
  ];

  for (let i = 0; i < faqItems.length; i++) {
    const faq = faqItems[i];
    await prisma.content.upsert({
      where: { id: `faq-${i + 1}` },
      update: {},
      create: {
        id: `faq-${i + 1}`,
        tenantId: DEFAULT_TENANT_ID,
        type: ContentType.FAQ,
        status: ContentStatus.PUBLISHED,
        title: faq.title,
        answer: faq.answer,
        category: faq.category,
        authorId: adminUser.id,
        sortOrder: i,
      },
    });
  }

  // 이용가이드
  await prisma.content.upsert({
    where: { id: 'guide-1' },
    update: {},
    create: {
      id: 'guide-1',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.GUIDE,
      status: ContentStatus.PUBLISHED,
      title: '중고폰 구매 가이드',
      content: '1. 원하는 기기의 모델과 용량을 선택하세요.\n2. 등급과 배터리 건강도를 확인하세요.\n3. 장바구니에 추가하고 결제를 진행하세요.\n4. 1~2 영업일 내 택배로 수령하세요.\n5. 수령 후 7일 이내 반품이 가능합니다.',
      authorId: adminUser.id,
      sortOrder: 0,
    },
  });

  await prisma.content.upsert({
    where: { id: 'guide-2' },
    update: {},
    create: {
      id: 'guide-2',
      tenantId: DEFAULT_TENANT_ID,
      type: ContentType.GUIDE,
      status: ContentStatus.PUBLISHED,
      title: '중고폰 판매 가이드',
      content: '1. 판매하기 페이지에서 기기 정보를 입력하세요.\n2. 예상 견적을 확인하고 판매 접수하세요.\n3. 택배 수거를 신청하면 무료로 방문 수거합니다.\n4. 기기 검수 후 최종 가격이 확정됩니다.\n5. 확정 당일 등록 계좌로 입금됩니다.',
      authorId: adminUser.id,
      sortOrder: 1,
    },
  });

  // 9. 배너 생성
  console.log('🖼️ Creating banners...');

  await prisma.banner.upsert({
    where: { id: 'banner-1' },
    update: {},
    create: {
      id: 'banner-1',
      tenantId: DEFAULT_TENANT_ID,
      title: '오픈 기념 할인 이벤트',
      imageUrl: 'https://placehold.co/1200x400/3B82F6/white?text=OPEN+SALE+10%25+OFF',
      linkUrl: '/events',
      position: BannerPosition.MAIN_TOP,
      isActive: true,
      sortOrder: 0,
    },
  });

  await prisma.banner.upsert({
    where: { id: 'banner-2' },
    update: {},
    create: {
      id: 'banner-2',
      tenantId: DEFAULT_TENANT_ID,
      title: '중고폰 판매 보너스',
      imageUrl: 'https://placehold.co/1200x400/10B981/white?text=SELL+BONUS+50000KRW',
      linkUrl: '/sell',
      position: BannerPosition.MAIN_TOP,
      isActive: true,
      sortOrder: 1,
    },
  });

  console.log('✅ Seeding completed! (50 products across 5 categories)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
