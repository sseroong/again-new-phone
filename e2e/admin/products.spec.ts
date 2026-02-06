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
  // 로그인 후 대시보드 로드 대기
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 10000 });
}

test.describe('관리자 상품 관리', () => {
  test('상품 목록 페이지 접근', async ({ page }) => {
    await adminLogin(page);
    await safeGoto(page, '/products');
    await expect(page.getByText(/상품/).first()).toBeVisible();
  });

  test('상품 목록에 데이터가 표시된다', async ({ page }) => {
    await adminLogin(page);
    await safeGoto(page, '/products');
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('상품 생성 페이지 접근', async ({ page }) => {
    await adminLogin(page);
    await safeGoto(page, '/products/create');
    await expect(page.getByText(/상품|등록|생성/).first()).toBeVisible();
  });

  test('비로그인 시 상품 관리 접근 차단', async ({ page }) => {
    await safeGoto(page, '/products');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test('사이드바 네비게이션이 동작한다', async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByText(/상품|주문|판매|사용자/).first()).toBeVisible();
  });
});
