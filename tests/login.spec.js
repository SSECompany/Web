/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — ĐĂNG NHẬP & PHÂN QUYỀN
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');

async function clearOverlays(page) {
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

test.describe('Đăng nhập', () => {

  test('TC01 — Trang đăng nhập hiển thị đúng', async ({ page }) => {
    await page.goto('/login');

    // Tiêu đề chào mừng
    await expect(page.getByText('Hí, Chào mừng trở lại')).toBeVisible();

    // Logo SSE
    await expect(page.locator('.login_logo_company_name')).toBeVisible();

    // Các trường input
    await expect(page.locator('#login_form_username')).toBeVisible();
    await expect(page.locator('#login_form_password')).toBeVisible();

    // Nút Đăng nhập
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();

    // Checkbox Remember me
    await expect(page.getByText('Remember me')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/login-TC01.png', fullPage: true });
  });

  test('TC02 — Đăng nhập với tài khoản đúng', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login_form_username').fill('sse2');
    await page.locator('#login_form_password').fill('123abc');
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Chờ redirect khỏi /login
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 });
    await clearOverlays(page);

    // Đã vào được bên trong hệ thống
    const currentURL = page.url();
    expect(currentURL).not.toContain('/login');

    console.log('✅ Đăng nhập thành công, redirect đến:', currentURL);
    await page.screenshot({ path: 'tests/screenshots/login-TC02.png', fullPage: true });
  });

  test('TC03 — Đăng nhập với mật khẩu sai', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#login_form_username').fill('sse2');
    await page.locator('#login_form_password').fill('wrong_password');
    await page.waitForTimeout(2500);

    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForTimeout(3000);

    // Vẫn ở trang login
    await expect(page).toHaveURL(/.*login/);

    // Hoặc hiện thông báo lỗi
    const hasError = await page.locator('.ant-notification-notice, .ant-message-error').isVisible().catch(() => false);
    console.log(hasError ? '✅ Có thông báo lỗi đăng nhập.' : '⚠️ Không thấy notification lỗi, nhưng vẫn ở /login.');

    await page.screenshot({ path: 'tests/screenshots/login-TC03.png', fullPage: true });
  });

  test('TC04 — Validation: không cho đăng nhập khi bỏ trống', async ({ page }) => {
    await page.goto('/login');

    // Click đăng nhập ngay mà không điền gì
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForTimeout(1000);

    // Kiểm tra thông báo validation
    const validationMsg = page.locator('.ant-form-item-explain-error');
    await expect(validationMsg.first()).toBeVisible();

    // Vẫn ở trang login
    await expect(page).toHaveURL(/.*login/);

    await page.screenshot({ path: 'tests/screenshots/login-TC04.png', fullPage: true });
  });
});
