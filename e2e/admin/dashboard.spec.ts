import { test, expect } from '@playwright/test';
import { dismissOverlay, safeGoto, safeFill, TEST_ACCOUNTS } from '../fixtures/auth.fixture';

async function adminLogin(page: any) {
  await safeGoto(page, '/login');
  await safeFill(page.getByPlaceholder('admin@phonegabi.com'), TEST_ACCOUNTS.admin.email);
  await safeFill(page.getByPlaceholder('비밀번호 입력'), TEST_ACCOUNTS.admin.password);
  await dismissOverlay(page);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await dismissOverlay(page);
  // 로그인 후 대시보드 페이지가 완전히 로드될 때까지 대기
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 10000 });
}

test.describe('관리자 대시보드', () => {
  test('대시보드 헤딩이 표시된다', async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
  });

  test('사이드바에 관리 메뉴가 표시된다', async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByRole('link', { name: '상품 관리' })).toBeVisible();
    await expect(page.getByRole('link', { name: '주문 관리' })).toBeVisible();
  });

  test('비로그인 시 대시보드 접근 차단', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});
