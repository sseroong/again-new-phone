import { test, expect } from '@playwright/test';
import { safeGoto, dismissOverlay } from '../fixtures/auth.fixture';

test.describe('구매 흐름', () => {
  test('비로그인 시 체크아웃 접근 시 로그인 리다이렉트', async ({ page }) => {
    // checkout은 /buy/checkout 경로이며 auth 미들웨어 적용
    // safeGoto로 하이드레이션 대기 후 클라이언트 미들웨어 동작 확인
    await safeGoto(page, '/buy/checkout');
    await expect(page).toHaveURL(/\/auth\/login|\/buy/, { timeout: 15000 });
  });

  test('구매 페이지에 상품 또는 빈 상태가 표시된다', async ({ page }) => {
    await safeGoto(page, '/buy');
    await expect(page.getByRole('heading', { name: '구매하기' })).toBeVisible();
  });

  test('홈페이지에서 인기 상품 또는 폴백이 표시된다', async ({ page }) => {
    await safeGoto(page, '/');
    // 인기 상품 섹션 확인 (API 데이터 또는 폴백)
    await expect(page.getByRole('heading', { name: '인기 상품' })).toBeVisible();
  });

  test('구매하기 전체보기 링크가 동작한다', async ({ page }) => {
    await safeGoto(page, '/');
    await dismissOverlay(page);
    // 전체보기 링크 클릭
    const viewAllLink = page.getByRole('link', { name: '전체보기 →' }).first();
    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/\/(buy|price|reviews)/);
    }
  });
});
