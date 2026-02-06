import { test, expect } from '@playwright/test';
import { safeGoto, loginViaUI, TEST_ACCOUNTS } from '../fixtures/auth.fixture';

test.describe('판매 접수 흐름', () => {
  test('비로그인 시 판매 페이지 접근 시 리다이렉트', async ({ page }) => {
    // sell 페이지는 auth 미들웨어가 적용되어 있음
    await page.goto('/sell');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('로그인 후 판매 페이지가 올바르게 표시된다', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/sell');
    await expect(page.getByRole('heading', { name: '판매하기' })).toBeVisible();
  });

  test('홈페이지에서 카테고리가 표시된다', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page.getByText('중고기기 판매하기')).toBeVisible();
  });

  test('홈페이지에서 판매 접수하기 버튼이 존재한다', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page.getByRole('link', { name: '판매 접수하기' })).toBeVisible();
  });

  test('네비게이션에서 판매하기 링크가 존재한다', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page.getByRole('link', { name: '판매하기' })).toBeVisible();
  });

  test('로그인 후 카테고리 선택이 가능하다', async ({ page }) => {
    await loginViaUI(page, TEST_ACCOUNTS.user.email, TEST_ACCOUNTS.user.password);
    await safeGoto(page, '/sell');
    // 카테고리 버튼 존재 확인
    const categories = page.getByText(/스마트폰|태블릿|노트북|스마트워치/);
    await expect(categories.first()).toBeVisible();
  });
});
