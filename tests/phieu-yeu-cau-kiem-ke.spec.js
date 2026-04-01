/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU YÊU CẦU KIỂM KÊ
 * ============================================================================
 *  Module: Kho > Phiếu yêu cầu kiểm kê
 *  Route:  /kho/yeu-cau-kiem-ke
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

test.describe('Nghiệp vụ Kho — Phiếu yêu cầu kiểm kê', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang danh sách phiếu kiểm kê hiển thị đúng', async ({ page }) => {
    await page.goto('/kho/yeu-cau-kiem-ke');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Bảng dữ liệu
    await expect(page.locator('.ant-table')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/kiem-ke-TC01.png', fullPage: true });
  });

  test('TC02 — Xem chi tiết phiếu kiểm kê', async ({ page }) => {
    await page.goto('/kho/yeu-cau-kiem-ke');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
    await page.waitForTimeout(2000);

    // Tìm dòng đầu tiên có nút xem chi tiết
    const firstActionBtn = page.locator('.ant-table-tbody .ant-table-row').first().locator('button').first();
    if (await firstActionBtn.isVisible()) {
      await firstActionBtn.click();
      await expect(page).toHaveURL(/.*yeu-cau-kiem-ke\/chi-tiet\/.*/);
    }

    await page.screenshot({ path: 'tests/screenshots/kiem-ke-TC02.png', fullPage: true });
  });

  test('TC03 — Nút quay lại về trang Kho', async ({ page }) => {
    await page.goto('/kho/yeu-cau-kiem-ke');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    await page.locator('.phieu-back-button').click();
    await expect(page).toHaveURL(/.*kho$/);
  });
});
