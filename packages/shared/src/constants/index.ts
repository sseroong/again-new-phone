import type { DeviceCategory, Brand, ProductGrade } from '../types';

// =============================================
// 카테고리
// =============================================

export const DEVICE_CATEGORIES: Record<DeviceCategory, { label: string; icon: string }> = {
  SMARTPHONE: { label: '스마트폰', icon: 'i-heroicons-device-phone-mobile' },
  TABLET: { label: '태블릿', icon: 'i-heroicons-device-tablet' },
  WATCH: { label: '스마트워치', icon: 'i-heroicons-clock' },
  LAPTOP: { label: '노트북', icon: 'i-heroicons-computer-desktop' },
  EARPHONE: { label: '무선이어폰', icon: 'i-heroicons-speaker-wave' },
};

// =============================================
// 브랜드
// =============================================

export const BRANDS: Record<Brand, { label: string; logo?: string }> = {
  APPLE: { label: '애플', logo: '/brands/apple.svg' },
  SAMSUNG: { label: '삼성', logo: '/brands/samsung.svg' },
  LG: { label: 'LG', logo: '/brands/lg.svg' },
  LENOVO: { label: '레노버', logo: '/brands/lenovo.svg' },
  OTHER: { label: '기타' },
};

// =============================================
// 등급
// =============================================

export const PRODUCT_GRADES: Record<ProductGrade, {
  label: string;
  description: string;
  color: string;
}> = {
  NEW: {
    label: '새제품',
    description: '미개봉 새제품',
    color: 'emerald',
  },
  UNOPENED: {
    label: '단순개봉',
    description: '개봉만 한 새제품급',
    color: 'green',
  },
  S_PLUS: {
    label: 'S+',
    description: '최상급 - 사용감 거의 없음',
    color: 'blue',
  },
  S: {
    label: 'S',
    description: '상급 - 미세 사용감',
    color: 'sky',
  },
  A: {
    label: 'A',
    description: '양호 - 외관깨끗, 액정깨끗',
    color: 'indigo',
  },
  B_PLUS: {
    label: 'B+',
    description: '보통 - 약간의 사용감',
    color: 'violet',
  },
  B: {
    label: 'B',
    description: '보통 - 외관미세흠집, 액정깨끗',
    color: 'purple',
  },
  C: {
    label: 'C',
    description: '사용감 있음 - 외관흠집/찍힘, 액정흠집',
    color: 'yellow',
  },
  D: {
    label: 'D',
    description: '하급 - 기능불량, 외관파손',
    color: 'orange',
  },
  E: {
    label: 'E',
    description: '최하급 - 심각한 파손/불량',
    color: 'red',
  },
};

// =============================================
// 판매 등급 (판매자용)
// =============================================

export const SELL_GRADES = {
  A: {
    label: 'A등급',
    screenCondition: '액정깨끗',
    bodyCondition: '외관깨끗',
  },
  B: {
    label: 'B등급',
    screenCondition: '액정깨끗',
    bodyCondition: '외관미세흠집',
  },
  C: {
    label: 'C등급',
    screenCondition: '액정흠집',
    bodyCondition: '외관흠집/찍힘',
  },
  D: {
    label: 'D등급',
    screenCondition: '액정흠집/파손',
    bodyCondition: '기능불량, 외관파손',
  },
  E: {
    label: 'E등급',
    screenCondition: '액정 심각한 파손/불량',
    bodyCondition: '기능불량',
  },
} as const;

// =============================================
// 저장 용량
// =============================================

export const STORAGE_OPTIONS = [
  '16GB',
  '32GB',
  '64GB',
  '128GB',
  '256GB',
  '512GB',
  '1024GB',
] as const;

// =============================================
// 가격 범위
// =============================================

export const PRICE_RANGES = [
  { label: '10만원 이하', min: 0, max: 100000 },
  { label: '10만원 ~ 30만원', min: 100000, max: 300000 },
  { label: '30만원 ~ 50만원', min: 300000, max: 500000 },
  { label: '50만원 ~ 70만원', min: 500000, max: 700000 },
  { label: '70만원 이상', min: 700000, max: Infinity },
] as const;

// =============================================
// 주문 상태
// =============================================

export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '배송 준비중',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
  COMPLETED: '거래 완료',
  CANCELLED: '취소됨',
  REFUNDED: '환불됨',
} as const;

// =============================================
// 판매 접수 상태
// =============================================

export const SELL_REQUEST_STATUS_LABELS = {
  PENDING: '접수 대기',
  QUOTED: '견적 제안됨',
  ACCEPTED: '견적 수락',
  SHIPPING: '배송 중',
  INSPECTING: '검수 중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
} as const;

// =============================================
// 거래 방식
// =============================================

export const TRADE_METHODS = {
  COURIER: { label: '택배 거래', description: '무료 수거 택배' },
  PICKUP: { label: '픽업 서비스', description: '직접 방문 수거' },
  VISIT: { label: '방문 거래', description: '매장 직접 방문' },
} as const;

// =============================================
// 페이지네이션
// =============================================

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

// =============================================
// 테넌트
// =============================================

export const TENANT_HEADER = 'x-tenant-id';
export const DEFAULT_TENANT_ID = 'default-tenant';

// =============================================
// API
// =============================================

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',

  // Products
  PRODUCTS: '/products',
  PRODUCTS_SEARCH: '/products/search',

  // Sell Requests
  SELL_REQUESTS: '/sell-requests',
  SELL_QUOTES: '/sell-quotes',

  // Orders
  ORDERS: '/orders',

  // Reviews
  REVIEWS: '/reviews',

  // Prices
  PRICES: '/prices',
  PRICES_QUOTE: '/prices/quote',

  // Users
  USERS: '/users',
  USERS_ME: '/users/me',
} as const;
