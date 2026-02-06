// =============================================
// 가격 포맷
// =============================================

/**
 * 숫자를 한국 원화 형식으로 포맷
 * @param price 가격 (숫자)
 * @returns 포맷된 가격 문자열 (예: "1,234,000원")
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

/**
 * 할인율 계산
 * @param originalPrice 원가
 * @param sellingPrice 판매가
 * @returns 할인율 (%)
 */
export function calculateDiscountRate(originalPrice: number, sellingPrice: number): number {
  if (originalPrice <= 0) return 0;
  const rate = ((originalPrice - sellingPrice) / originalPrice) * 100;
  return Math.round(rate * 10) / 10;
}

// =============================================
// 날짜 포맷
// =============================================

/**
 * 날짜를 한국어 형식으로 포맷
 * @param date 날짜
 * @returns 포맷된 날짜 문자열 (예: "2024.01.15")
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d).replace(/\. /g, '.').replace(/\.$/, '');
}

/**
 * 날짜를 상대적 시간으로 표시
 * @param date 날짜
 * @returns 상대적 시간 문자열 (예: "3일 전")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 0 ? '방금 전' : `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  }
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

// =============================================
// 문자열 처리
// =============================================

/**
 * 이름 마스킹 (예: "홍길동" → "홍**")
 * @param name 이름
 * @returns 마스킹된 이름
 */
export function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

/**
 * 전화번호 마스킹 (예: "01012345678" → "010****5678")
 * @param phone 전화번호
 * @returns 마스킹된 전화번호
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  const cleaned = phone.replace(/-/g, '');
  return cleaned.slice(0, 3) + '****' + cleaned.slice(-4);
}

/**
 * 전화번호 포맷 (예: "01012345678" → "010-1234-5678")
 * @param phone 전화번호
 * @returns 포맷된 전화번호
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
}

// =============================================
// 배터리 효율
// =============================================

/**
 * 배터리 효율 상태 레이블
 * @param health 배터리 효율 (%)
 * @returns 상태 레이블
 */
export function getBatteryHealthLabel(health: number): string {
  if (health >= 95) return '최상';
  if (health >= 85) return '양호';
  if (health >= 75) return '보통';
  if (health >= 65) return '주의';
  return '교체 권장';
}

/**
 * 배터리 효율 색상
 * @param health 배터리 효율 (%)
 * @returns 색상 클래스
 */
export function getBatteryHealthColor(health: number): string {
  if (health >= 95) return 'text-green-600';
  if (health >= 85) return 'text-emerald-600';
  if (health >= 75) return 'text-yellow-600';
  if (health >= 65) return 'text-orange-600';
  return 'text-red-600';
}

// =============================================
// 유효성 검사
// =============================================

/**
 * 이메일 형식 검사
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 형식 검사
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^01[016789]\d{7,8}$/;
  return phoneRegex.test(phone.replace(/-/g, ''));
}

/**
 * 비밀번호 강도 검사
 * @returns 점수 (0-4) 및 메시지
 */
export function checkPasswordStrength(password: string): {
  score: number;
  message: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const messages = ['매우 약함', '약함', '보통', '강함', '매우 강함'];
  return {
    score: Math.min(score, 4),
    message: messages[Math.min(score, 4)],
  };
}

// =============================================
// 기타
// =============================================

/**
 * 딜레이 함수
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 객체에서 undefined 값 제거
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * 쿼리 문자열 생성
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const filtered = removeUndefined(params as Record<string, unknown>);
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filtered)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}
