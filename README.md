# Phone Marketplace

중고 전자기기 거래 플랫폼 (폰가비 클론)

## 프로젝트 개요

중고 스마트폰, 태블릿, 스마트워치, 노트북 등 전자기기의 판매 및 구매를 지원하는 거래 플랫폼입니다.

### 주요 기능

- **판매하기**: 중고기기 판매 접수, 시세 조회, 견적 수락
- **구매하기**: 상품 검색/필터링, 주문/결제
- **리뷰**: 거래 후기 작성 및 조회
- **시세 조회**: 기기별 시세 정보 제공

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | Nuxt 3, Vue 3, Tailwind CSS, Pinia, Nuxt UI |
| **Backend** | NestJS, TypeScript, Prisma |
| **Database** | PostgreSQL, Redis |
| **Payment** | 토스페이먼츠 |
| **Infrastructure** | Docker, pnpm workspace |

## 프로젝트 구조

```
phone-marketplace/
├── apps/
│   ├── web/                 # Nuxt 3 프론트엔드
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── components/      # UI 컴포넌트
│   │   ├── composables/     # 컴포저블 훅
│   │   ├── stores/          # Pinia 스토어
│   │   └── layouts/         # 레이아웃
│   │
│   ├── api/                 # NestJS 백엔드
│   │   └── src/
│   │       ├── auth/        # 인증 모듈
│   │       ├── users/       # 사용자 모듈
│   │       ├── products/    # 상품 모듈
│   │       ├── orders/      # 주문 모듈
│   │       ├── sell-requests/ # 판매 접수 모듈
│   │       ├── reviews/     # 리뷰 모듈
│   │       ├── prices/      # 시세 모듈
│   │       └── prisma/      # Prisma 서비스
│   │
│   └── admin/               # 백오피스 (예정)
│
├── packages/
│   ├── shared/              # 공통 타입, 상수, 유틸리티
│   └── ui/                  # 공통 UI 컴포넌트
│
├── prisma/
│   ├── schema.prisma        # 데이터베이스 스키마
│   └── seed.ts              # 초기 데이터
│
├── docs/                    # 문서
│   └── PLAN.md              # 기획 문서
│
├── docker-compose.yml       # Docker 설정
└── package.json             # 모노레포 설정
```

## 시작하기

### 요구사항

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd phone-marketplace

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (필요시)
```

### 데이터베이스 설정

```bash
# Docker로 PostgreSQL, Redis 실행
docker-compose up -d

# Prisma 마이그레이션
pnpm db:migrate

# 초기 데이터 시드
pnpm db:seed
```

### 개발 서버 실행

```bash
# 전체 실행 (API + Web)
pnpm dev

# 또는 개별 실행
pnpm dev:api   # API 서버만
pnpm dev:web   # Web 클라이언트만
```

### 접속 URL

| 서비스 | URL |
|--------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |

## API 엔드포인트

### 인증 (Auth)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 갱신 |
| GET | `/api/auth/profile` | 내 정보 조회 |

### 사용자 (Users)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users/me` | 내 정보 조회 |
| PATCH | `/api/users/me` | 내 정보 수정 |
| POST | `/api/users/me/password` | 비밀번호 변경 |
| GET | `/api/users/me/addresses` | 배송지 목록 |
| POST | `/api/users/me/addresses` | 배송지 추가 |

### 상품 (Products)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/products` | 상품 목록 (필터링/페이징) |
| GET | `/api/products/:id` | 상품 상세 |
| GET | `/api/products/categories` | 카테고리 목록 |
| GET | `/api/products/models` | 기기 모델 목록 |
| GET | `/api/products/popular` | 인기 상품 |
| GET | `/api/products/new` | 신규 상품 |

### 주문 (Orders)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/orders` | 주문 생성 |
| GET | `/api/orders` | 내 주문 목록 |
| GET | `/api/orders/:id` | 주문 상세 |
| DELETE | `/api/orders/:id` | 주문 취소 |
| POST | `/api/orders/confirm` | 결제 확인 |

### 판매 접수 (Sell Requests)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/sell-requests` | 판매 접수 |
| GET | `/api/sell-requests` | 내 판매 접수 목록 |
| GET | `/api/sell-requests/:id` | 판매 접수 상세 |
| POST | `/api/sell-requests/:id/quotes/:quoteId/accept` | 견적 수락 |
| POST | `/api/sell-requests/:id/tracking` | 송장번호 등록 |
| GET | `/api/sell-requests/estimate/price` | 예상 시세 조회 |

### 리뷰 (Reviews)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/reviews` | 리뷰 목록 |
| GET | `/api/reviews/:id` | 리뷰 상세 |
| POST | `/api/reviews` | 리뷰 작성 |
| POST | `/api/reviews/:id/like` | 리뷰 좋아요 |
| GET | `/api/reviews/stats` | 리뷰 통계 |

### 시세 (Prices)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/prices` | 시세 목록 |
| GET | `/api/prices/today` | 오늘의 시세 |
| GET | `/api/prices/popular` | 인기 모델 시세 |
| GET | `/api/prices/search` | 시세 검색 |
| GET | `/api/prices/models/:modelId` | 모델별 시세 |
| GET | `/api/prices/history/:modelId` | 시세 변동 히스토리 |

## 데이터베이스 스키마

### 주요 모델

- **User**: 사용자 (일반/파트너/관리자)
- **Product**: 상품 (판매용 중고기기)
- **Category**: 카테고리 (스마트폰/태블릿/워치 등)
- **DeviceModel**: 기기 모델 (아이폰 15 Pro 등)
- **ModelVariant**: 모델 변형 (용량/색상)
- **Order**: 구매 주문
- **SellRequest**: 판매 접수
- **Review**: 거래 리뷰
- **PriceGuide**: 시세 정보

### 등급 시스템

| 등급 | 설명 |
|------|------|
| NEW | 새제품 |
| UNOPENED | 미개봉 |
| S_PLUS | 최상급 |
| S | 상급 |
| A | 양호 |
| B_PLUS | 사용감 있음 |
| B | 사용감 있음 |
| C | 흠집/찍힘 |
| D | 파손 |
| E | 기능불량 |

## 스크립트

```bash
# 개발
pnpm dev          # 전체 개발 서버
pnpm dev:api      # API만
pnpm dev:web      # Web만

# 빌드
pnpm build        # 전체 빌드
pnpm build:api    # API만
pnpm build:web    # Web만

# 데이터베이스
pnpm db:migrate   # 마이그레이션 실행
pnpm db:seed      # 시드 데이터 삽입
pnpm db:studio    # Prisma Studio 실행
pnpm db:generate  # Prisma Client 생성

# 린트/포맷
pnpm lint         # 린트 실행
pnpm format       # 포맷팅
```

## 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@phonegabi.com | Admin123! |
| 테스트 사용자 | test@example.com | Test123! |

## 환경 변수

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phone_marketplace"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Toss Payments
TOSS_CLIENT_KEY="test_ck_xxxxxxxxxxxx"
TOSS_SECRET_KEY="test_sk_xxxxxxxxxxxx"

# App
NODE_ENV="development"
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"
```

## 문서

- [기획 문서](./docs/PLAN.md) - 사이트 분석 및 설계

## 향후 계획

- [ ] 백오피스 (Admin) 개발
- [ ] 멀티테넌트 아키텍처 적용
- [ ] 챗봇 기능
- [ ] 렌탈 서비스
- [ ] 고급 통계/리포트

## 라이선스

Private
