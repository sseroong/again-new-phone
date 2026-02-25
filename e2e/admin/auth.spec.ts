import { test, expect } from '@playwright/test';
import { dismissOverlay, safeGoto, safeFill } from '../fixtures/auth.fixture';

test.describe('관리자 인증', () => {
  test('관리자 로그인 페이지가 표시된다', async ({ page }) => {
    await safeGoto(page, '/login');
    await expect(page.getByRole('heading', { name: '딱내폰 관리자' })).toBeVisible();
    await expect(page.getByPlaceholder('admin@phonegabi.com')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호 입력')).toBeVisible();
  });

  test('관리자 계정으로 로그인 성공', async ({ page }) => {
    await safeGoto(page, '/login');
    await safeFill(page.getByPlaceholder('admin@phonegabi.com'), 'admin@phonegabi.com');
    await safeFill(page.getByPlaceholder('비밀번호 입력'), 'Admin123!');
    await dismissOverlay(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    // 대시보드 헤딩 확인
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible({ timeout: 10000 });
  });

  test('일반 사용자 계정으로 관리자 로그인 차단', async ({ page }) => {
    await safeGoto(page, '/login');
    await safeFill(page.getByPlaceholder('admin@phonegabi.com'), 'test@example.com');
    await safeFill(page.getByPlaceholder('비밀번호 입력'), 'Test123!');
    await dismissOverlay(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForTimeout(3000);
    // 일반 사용자는 로그인 후 관리자 체크에서 실패하여 /login으로 리다이렉트됨
    const url = page.url();
    const isBlocked = url.includes('/login') || await page.getByText(/권한|실패|오류/).isVisible().catch(() => false);
    expect(isBlocked).toBeTruthy();
  });
});
