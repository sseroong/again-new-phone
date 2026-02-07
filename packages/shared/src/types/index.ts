// =============================================
// 기본 타입
// =============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// =============================================
// 사용자 관련 타입
// =============================================

export type UserRole = 'USER' | 'PARTNER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// =============================================
// 테넌트 관련 타입
// =============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTenant {
  userId: string;
  tenantId: string;
  role: UserRole;
  isActive: boolean;
  joinedAt: Date;
}

// =============================================
// 상품 관련 타입
// =============================================

export type DeviceCategory = 'SMARTPHONE' | 'TABLET' | 'WATCH' | 'LAPTOP' | 'EARPHONE';

export type Brand = 'APPLE' | 'SAMSUNG' | 'LG' | 'LENOVO' | 'OTHER';

export type ProductGrade = 'NEW' | 'UNOPENED' | 'S_PLUS' | 'S' | 'A' | 'B_PLUS' | 'B' | 'C' | 'D' | 'E';

export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'UNAVAILABLE';

export interface Product {
  id: string;
  category: DeviceCategory;
  brand: Brand;
  model: string;
  variant: string; // 용량 (128GB, 256GB 등)
  color: string;
  grade: ProductGrade;
  status: ProductStatus;
  originalPrice: number;
  sellingPrice: number;
  discountRate: number;
  batteryHealth?: number;
  warrantyExpiry?: Date;
  manufactureDate?: Date;
  description?: string;
  images: string[];
  specs?: Record<string, string>;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilter {
  category?: DeviceCategory;
  brand?: Brand;
  series?: string;
  grade?: ProductGrade[];
  storage?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

// =============================================
// 판매 접수 관련 타입
// =============================================

export type SellRequestStatus =
  | 'PENDING'      // 접수 대기
  | 'QUOTED'       // 견적 제안됨
  | 'ACCEPTED'     // 견적 수락
  | 'SHIPPING'     // 배송 중
  | 'INSPECTING'   // 검수 중
  | 'COMPLETED'    // 완료 (입금됨)
  | 'CANCELLED';   // 취소됨

export type TradeMethod = 'COURIER' | 'PICKUP' | 'VISIT';

export interface SellRequest {
  id: string;
  userId: string;
  category: DeviceCategory;
  brand: Brand;
  model: string;
  variant: string;
  color: string;
  selfGrade: ProductGrade;
  finalGrade?: ProductGrade;
  estimatedPrice: number;
  finalPrice?: number;
  status: SellRequestStatus;
  tradeMethod: TradeMethod;
  deviceCondition: DeviceCondition;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceCondition {
  screenCondition: 'PERFECT' | 'MINOR_SCRATCH' | 'SCRATCH' | 'CRACKED' | 'DAMAGED';
  bodyCondition: 'PERFECT' | 'MINOR_SCRATCH' | 'SCRATCH' | 'DENT' | 'DAMAGED';
  functionalIssues: string[];
  batteryHealth?: number;
  hasOriginalBox: boolean;
  hasAccessories: boolean;
  additionalNotes?: string;
}

// =============================================
// 주문 관련 타입
// =============================================

export type OrderStatus =
  | 'PENDING_PAYMENT'  // 결제 대기
  | 'PAID'             // 결제 완료
  | 'PREPARING'        // 배송 준비
  | 'SHIPPING'         // 배송 중
  | 'DELIVERED'        // 배송 완료
  | 'COMPLETED'        // 거래 완료
  | 'CANCELLED'        // 취소됨
  | 'REFUNDED';        // 환불됨

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentInfo?: PaymentInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  memo?: string;
}

export interface PaymentInfo {
  method: 'CARD' | 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionId?: string;
  paidAt?: Date;
}

// =============================================
// 리뷰 관련 타입
// =============================================

export type ReviewType = 'SELL' | 'BUY';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  type: ReviewType;
  orderId?: string;
  sellRequestId?: string;
  productModel: string;
  title: string;
  content: string;
  rating: number;
  likes: number;
  images?: string[];
  quotesReceived?: number;
  createdAt: Date;
}

// =============================================
// 시세 관련 타입
// =============================================

export interface PriceHistory {
  id: string;
  model: string;
  variant: string;
  grade: ProductGrade;
  price: number;
  previousPrice?: number;
  changeRate?: number;
  recordedAt: Date;
}

export interface PriceQuote {
  model: string;
  variant: string;
  grades: {
    grade: ProductGrade;
    price: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  }[];
  updatedAt: Date;
}
