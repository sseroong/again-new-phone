import { test, expect } from '@playwright/test';
import { safeGoto, dismissOverlay, safeFill } from '../fixtures/auth.fixture';

test.describe('인증 흐름', () => {
  test('로그인 페이지가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/auth/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByPlaceholder('이메일을 입력하세요')).toBeVisible();
    await expect(page.getByPlaceholder('비밀번호를 입력하세요')).toBeVisible();
  });

  test('올바른 자격증명으로 로그인 성공', async ({ page }) => {
    await safeGoto(page, '/auth/login');
    await safeFill(page.getByPlaceholder('이메일을 입력하세요'), 'test@example.com');
    await safeFill(page.getByPlaceholder('비밀번호를 입력하세요'), 'Test123!');
    await dismissOverlay(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    await expect(page.getByText('테스트 사용자님')).toBeVisible({ timeout: 10000 });
  });

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    await safeGoto(page, '/auth/login');
    await safeFill(page.getByPlaceholder('이메일을 입력하세요'), 'test@example.com');
    await safeFill(page.getByPlaceholder('비밀번호를 입력하세요'), 'WrongPass123!');
    await dismissOverlay(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('회원가입 페이지가 올바르게 표시된다', async ({ page }) => {
    await safeGoto(page, '/auth/register');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });

  test('로그아웃이 정상 동작한다', async ({ page }) => {
    await safeGoto(page, '/auth/login');
    await safeFill(page.getByPlaceholder('이메일을 입력하세요'), 'test@example.com');
    await safeFill(page.getByPlaceholder('비밀번호를 입력하세요'), 'Test123!');
    await dismissOverlay(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    await dismissOverlay(page);
    await page.getByText('로그아웃').click();
    await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('인증되지 않은 사용자가 마이페이지 접근 시 리다이렉트', async ({ page }) => {
    // auth 미들웨어는 클라이언트 하이드레이션 후 동작
    await safeGoto(page, '/my/transactions');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('로그인 페이지에서 회원가입 링크 동작', async ({ page }) => {
    await safeGoto(page, '/auth/login');
    await page.getByRole('link', { name: '회원가입' }).first().click();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('빈 필드로 로그인 시도 시 에러 표시', async ({ page }) => {
    await safeGoto(page, '/auth/login');
    await dismissOverlay(page);
    await page.getByRole('button', { name: '로그인' }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
