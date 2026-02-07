import { test as base, type Page, type Locator, expect } from '@playwright/test';

export const TEST_ACCOUNTS = {
  user: { email: 'test@example.com', password: 'Test123!', name: '테스트 사용자' },
  admin: { email: 'admin@phonegabi.com', password: 'Admin123!', name: '관리자' },
};

/**
 * vite-error-overlay를 제거하는 헬퍼.
 */
export async function dismissOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay');
    if (overlay) overlay.remove();
  });
}

/**
 * Nuxt 앱의 클라이언트 하이드레이션이 완료될 때까지 대기.
 * 하이드레이션 전에 폼을 제출하면 @submit.prevent가 동작하지 않아
 * 일반 HTML 폼 제출이 발생한다.
 */
async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const nuxtApp = document.querySelector('#__nuxt');
    // @ts-ignore - Vue 내부 속성 접근
    return nuxtApp && (nuxtApp as any).__vue_app__ !== undefined;
  }, { timeout: 10000 });
  await dismissOverlay(page);
  // Vue 컴포넌트 초기화 완료 대기 (하이드레이션 직후 개별 컴포넌트가 초기화됨)
  await page.waitForTimeout(2000);
}

/**
 * 페이지 이동 후 안정화 대기.
 * SSR 렌더링 + 클라이언트 하이드레이션까지 보장한다.
 */
export async function safeGoto(page: Page, url: string) {
  await page.goto(url);
  await waitForHydration(page);
}

/**
 * Nuxt UI UInput에 안정적으로 값을 입력하는 헬퍼.
 * 하이드레이션 완료 후에는 fill()이 정상 동작한다.
 * 실패 시 click + keyboard.type 폴백.
 */
export async function safeFill(locator: Locator, value: string) {
  await locator.click();
  await locator.fill(value);
}

/**
 * UI를 통한 로그인.
 * 하이드레이션 완료 후 폼을 작성하여 로그인한다.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await safeGoto(page, '/auth/login');
  await safeFill(page.getByPlaceholder('이메일을 입력하세요'), email);
  await safeFill(page.getByPlaceholder('비밀번호를 입력하세요'), password);
  await dismissOverlay(page);
  await page.getByRole('button', { name: '로그인' }).click();
  // 클라이언트 사이드 네비게이션: URL이 /auth/login에서 벗어날 때까지 대기
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
}

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await loginViaUI(page, TEST_ACCOUNTS.admin.email, TEST_ACCOUNTS.admin.password);
    await use(page);
  },
});

export { expect } from '@playwright/test';
