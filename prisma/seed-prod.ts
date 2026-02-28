/**
 * 프로덕션 초기 설정 스크립트
 *
 * 생성 항목:
 *   1. 기본 테넌트
 *   2. 관리자 계정 (SUPER_ADMIN)
 *   3. 기기 카테고리 (enum 기반)
 *
 * 사용법:
 *   # 로컬 (환경변수 .env 자동 로드)
 *   npx ts-node prisma/seed-prod.ts
 *
 *   # Docker (VPS)
 *   docker compose -f docker-compose.prod.yml run --rm api \
 *     node -e "require('./prisma/seed-prod')"
 *
 * 환경변수:
 *   ADMIN_EMAIL    - 관리자 이메일 (기본: admin@ddakmyphone.com)
 *   ADMIN_PASSWORD - 관리자 비밀번호 (필수, 미설정 시 에러)
 *   ADMIN_NAME     - 관리자 이름 (기본: 관리자)
 *   TENANT_NAME    - 테넌트 이름 (기본: 딱내폰)
 *   TENANT_SLUG    - 테넌트 슬러그 (기본: ddakmyphone)
 */

import { PrismaClient, DeviceCategory, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 프로덕션 초기 설정 시작...\n');

  // -----------------------------------------------------------------------
  // 환경변수 검증
  // -----------------------------------------------------------------------
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ddakmyphone.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_NAME = process.env.ADMIN_NAME || '관리자';
  const TENANT_NAME = process.env.TENANT_NAME || '딱내폰';
  const TENANT_SLUG = process.env.TENANT_SLUG || 'ddakmyphone';

  if (!ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.');
    console.error('   예: ADMIN_PASSWORD="SecureP@ss123!" npx ts-node prisma/seed-prod.ts');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('❌ ADMIN_PASSWORD는 8자 이상이어야 합니다.');
    process.exit(1);
  }

  // -----------------------------------------------------------------------
  // 1. 테넌트 생성
  // -----------------------------------------------------------------------
  console.log(`🏢 테넌트 생성: ${TENANT_NAME} (${TENANT_SLUG})`);
  let tenant = await prisma.tenant.findFirst({
    where: { OR: [{ slug: TENANT_SLUG }, { id: 'default-tenant' }] },
  });
  if (tenant) {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { name: TENANT_NAME, slug: TENANT_SLUG },
    });
    console.log(`   ✅ 기존 테넌트 업데이트: ${tenant.id}`);
  } else {
    tenant = await prisma.tenant.create({
      data: {
        id: 'default-tenant',
        name: TENANT_NAME,
        slug: TENANT_SLUG,
        settings: {},
      },
    });
    console.log(`   ✅ 새 테넌트 생성: ${tenant.id}`);
  }

  // -----------------------------------------------------------------------
  // 2. 카테고리 생성 (enum 기반 필수 데이터)
  // -----------------------------------------------------------------------
  console.log('\n📦 카테고리 생성...');
  const categoryData: { type: DeviceCategory; name: string; description: string; icon: string; sortOrder: number }[] = [
    { type: DeviceCategory.SMARTPHONE, name: '스마트폰', description: '아이폰, 갤럭시 등 스마트폰', icon: 'smartphone', sortOrder: 1 },
    { type: DeviceCategory.TABLET, name: '태블릿', description: '아이패드, 갤럭시탭 등 태블릿', icon: 'tablet', sortOrder: 2 },
    { type: DeviceCategory.WATCH, name: '스마트워치', description: '애플워치, 갤럭시워치 등', icon: 'watch', sortOrder: 3 },
    { type: DeviceCategory.LAPTOP, name: '노트북', description: '맥북, 갤럭시북 등 노트북', icon: 'laptop', sortOrder: 4 },
    { type: DeviceCategory.EARPHONE, name: '무선이어폰', description: '에어팟, 갤럭시버즈 등', icon: 'earphone', sortOrder: 5 },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { type: cat.type },
      update: {},
      create: cat,
    });
    console.log(`   ✅ ${cat.name} (${cat.type})`);
  }

  // -----------------------------------------------------------------------
  // 3. 관리자 계정 생성
  // -----------------------------------------------------------------------
  console.log(`\n👤 관리자 계정 생성: ${ADMIN_EMAIL}`);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log(`   ✅ 사용자 ID: ${adminUser.id}`);

  // -----------------------------------------------------------------------
  // 4. 관리자 → 테넌트 할당
  // -----------------------------------------------------------------------
  console.log('\n🔗 관리자 테넌트 할당...');
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: { userId: adminUser.id, tenantId: tenant.id },
    },
    update: { role: UserRole.SUPER_ADMIN },
    create: {
      userId: adminUser.id,
      tenantId: tenant.id,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log(`   ✅ ${ADMIN_EMAIL} → ${TENANT_NAME}`);

  // -----------------------------------------------------------------------
  // 완료
  // -----------------------------------------------------------------------
  console.log('\n' + '='.repeat(50));
  console.log('✅ 프로덕션 초기 설정 완료!');
  console.log('='.repeat(50));
  console.log(`  테넌트: ${TENANT_NAME} (${TENANT_SLUG})`);
  console.log(`  관리자: ${ADMIN_EMAIL}`);
  console.log(`  카테고리: ${categoryData.length}개`);
  console.log('\n  어드민 페이지에서 로그인하세요: https://admin.ddakmyphone.com');
}

main()
  .catch((e) => {
    console.error('❌ 초기 설정 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
