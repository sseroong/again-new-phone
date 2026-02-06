import { test, expect } from '@playwright/test';
import { safeGoto } from '../fixtures/auth.fixture';

test.describe('상품 탐색', () => {
  test('홈페이지가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/');
    // 히어로 섹션 내용 확인
    await expect(page.getByText('최고가로 내 폰 팔기')).toBeVisible();
    await expect(page.getByRole('heading', { name: '인기 상품' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '실거래 리뷰' })).toBeVisible();
  });

  test('네비게이션 메뉴가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page.getByRole('link', { name: '판매하기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '구매하기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '나의 거래내역' })).toBeVisible();
    await expect(page.getByRole('link', { name: '실거래 리뷰' })).toBeVisible();
    await expect(page.getByRole('link', { name: '중고폰 시세' })).toBeVisible();
  });

  test('구매하기 페이지가 상품 목록을 표시한다', async ({ page }) => {
    await safeGoto(page, '/buy');
    await expect(page.getByRole('heading', { name: '구매하기' })).toBeVisible();
  });

  test('시세 조회 페이지가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/price');
    await expect(page.getByRole('heading', { name: '중고폰 시세' })).toBeVisible();
  });

  test('리뷰 목록 페이지가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/reviews');
    await expect(page.getByRole('heading', { name: '실거래 리뷰' })).toBeVisible();
  });

  test('판매하기 페이지 접근 시 로그인 리다이렉트', async ({ page }) => {
    // sell 페이지는 auth 미들웨어가 적용되어 있어 리다이렉트됨
    await page.goto('/sell');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('푸터가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page.getByText('폰마켓 고객센터')).toBeVisible();
    await expect(page.getByRole('link', { name: '이용약관' })).toBeVisible();
    await expect(page.getByRole('link', { name: '개인정보 처리방침' })).toBeVisible();
  });
});
