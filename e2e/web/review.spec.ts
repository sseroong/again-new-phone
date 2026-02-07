import { test, expect } from '@playwright/test';
import { safeGoto, loginViaUI, TEST_ACCOUNTS } from '../fixtures/auth.fixture';

test.describe('리뷰 기능', () => {
  test('리뷰 목록 페이지가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/reviews');
    await expect(page.getByRole('heading', { name: '실거래 리뷰' })).toBeVisible();
  });

  test('리뷰 통계 영역이 표시된다', async ({ page }) => {
    await safeGoto(page, '/reviews');
    // 통계 영역: 총 리뷰와 평균 별점이 각각 별도 요소에 표시됨
    await expect(page.getByText('총 리뷰')).toBeVisible();
    await expect(page.getByText('평균 별점')).toBeVisible();
  });

  test('리뷰 필터 탭이 표시된다', async ({ page }) => {
    await safeGoto(page, '/reviews');
    await expect(page.getByText('전체')).toBeVisible();
    await expect(page.getByText('구매 리뷰')).toBeVisible();
    await expect(page.getByText('판매 리뷰')).toBeVisible();
  });

  test('비로그인 시 나의 리뷰 접근 시 리다이렉트', async ({ page }) => {
    await page.goto('/my/reviews');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('로그인 후 나의 리뷰 페이지 접근 가능', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/reviews');
    await expect(page.getByRole('heading', { name: '나의 리뷰' })).toBeVisible();
  });

  test('나의 리뷰 페이지 빈 상태 또는 리뷰 표시', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/reviews');
    const heading = page.getByRole('heading', { name: '나의 리뷰' });
    await expect(heading).toBeVisible();
  });

  test('거래내역 페이지에서 탭 구조 확인', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/my/transactions');
    await expect(page.getByRole('heading', { name: '나의 거래내역' })).toBeVisible();
    await expect(page.getByRole('button', { name: /구매 내역/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /판매 내역/ })).toBeVisible();
  });

  test('리뷰 페이지가 에러 없이 로드된다', async ({ page }) => {
    await safeGoto(page, '/reviews');
    await expect(page).toHaveURL('/reviews');
    await expect(page.getByRole('heading', { name: '실거래 리뷰' })).toBeVisible();
  });
});
