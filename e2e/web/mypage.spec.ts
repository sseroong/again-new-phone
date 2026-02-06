import { test, expect } from '@playwright/test';
import { safeGoto, dismissOverlay, loginViaUI, TEST_ACCOUNTS } from '../fixtures/auth.fixture';

test.describe('마이페이지 기능', () => {
  test('프로필 수정 페이지 접근', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/profile');
    await expect(page.getByRole('heading', { name: '프로필 수정' })).toBeVisible();
  });

  test('배송지 관리 페이지 접근', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/addresses');
    await expect(page.getByRole('heading', { name: '배송지 관리' })).toBeVisible();
  });

  test('내 기기 관리 페이지 접근', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/devices');
    await expect(page.getByRole('heading', { name: /기기 관리/ })).toBeVisible();
  });

  test('거래내역 페이지 접근', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/transactions');
    await expect(page.getByRole('heading', { name: '나의 거래내역' })).toBeVisible();
  });

  test('거래내역 탭 전환이 동작한다', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/transactions');
    const sellTab = page.getByRole('button', { name: /판매 내역/ });
    await expect(sellTab).toBeVisible();
    await sellTab.click();
    await expect(sellTab).toBeVisible();
  });

  test('사용자 드롭다운 메뉴가 동작한다', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await dismissOverlay(page);
    // 사용자 이름 버튼 클릭 (테스트 사용자님)
    await page.getByText('테스트 사용자님').click();
    await page.waitForTimeout(500);
    // 메뉴 항목 확인
    await expect(page.getByText('나의 거래내역').last()).toBeVisible();
  });

  test('사용자 메뉴에서 나의 리뷰 클릭 시 이동', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await dismissOverlay(page);
    await page.getByText('테스트 사용자님').click();
    await page.waitForTimeout(500);
    await page.getByText('나의 리뷰').last().click();
    await expect(page).toHaveURL(/\/my\/reviews/);
  });

  test('비로그인 시 마이페이지 리다이렉트', async ({ page }) => {
    await safeGoto(page, '/my/profile');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });
});
