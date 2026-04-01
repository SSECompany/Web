/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU NHẬP ĐIỀU CHUYỂN
 * ============================================================================
 *  Module: Kho > Phiếu nhập điều chuyển
 *  Route:  /kho/nhap-dieu-chuyen
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth.helper');

async function clearOverlays(page) {
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

test.describe('Nghiệp vụ Kho — Phiếu nhập điều chuyển', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang danh sách phiếu nhập điều chuyển hiển thị đúng', async ({ page }) => {
    await page.goto('/kho/nhap-dieu-chuyen');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Tiêu đề
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẬP ĐIỀU CHUYỂN');

    // Nút Tạo mới
    await expect(page.getByRole('button', { name: /Tạo mới/i })).toBeVisible();

    // Bảng dữ liệu hiện
    await expect(page.locator('.ant-table')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nhap-dieu-chuyen-TC01.png', fullPage: true });
  });

  test('TC02 — Điều hướng đến trang thêm mới', async ({ page }) => {
    await page.goto('/kho/nhap-dieu-chuyen');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    await page.getByRole('button', { name: /Tạo mới/i }).click();
    await expect(page).toHaveURL(/.*nhap-dieu-chuyen\/them-moi/);

    await page.screenshot({ path: 'tests/screenshots/nhap-dieu-chuyen-TC02.png', fullPage: true });
  });

  test('TC03 — Nút quay lại hoạt động đúng', async ({ page }) => {
    await page.goto('/kho/nhap-dieu-chuyen/them-moi');
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    await page.locator('.phieu-back-button').click();
    await expect(page).toHaveURL(/.*nhap-dieu-chuyen$/);
  });

  test('TC04 — Form thêm mới hiển thị đúng các trường', async ({ page }) => {
    await page.goto('/kho/nhap-dieu-chuyen/them-moi');
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Kiểm tra nút Lưu phiếu tồn tại
    await expect(page.getByRole('button', { name: 'Lưu phiếu' })).toBeVisible();

    // Kiểm tra tab Chi tiết
    await expect(page.getByText('Chi tiết')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nhap-dieu-chuyen-TC04.png', fullPage: true });
  });

  test('TC05 — Validation: không lưu khi chưa có dữ liệu', async ({ page }) => {
    await page.goto('/kho/nhap-dieu-chuyen/them-moi');
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(1500);

    // Vẫn ở trang thêm mới
    await expect(page).toHaveURL(/.*them-moi/);

    await page.screenshot({ path: 'tests/screenshots/nhap-dieu-chuyen-TC05.png', fullPage: true });
  });
});
