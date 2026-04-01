/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU NHẶT HÀNG
 * ============================================================================
 *  Module: Kho > Phiếu nhặt hàng
 *  Route:  /kho/nhat-hang
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { login, dismissNotifications } = require('./helpers/auth.helper');

async function clearOverlays(page) {
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

test.describe('Nghiệp vụ Kho — Phiếu nhặt hàng', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang danh sách phiếu nhặt hàng hiển thị đúng', async ({ page }) => {
    await page.goto('/kho/nhat-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Tiêu đề (desktop = "PHIẾU NHẶT HÀNG")
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẶT HÀNG');

    // Bảng hiện
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();

    // Các cột chính
    const header = page.locator('.ant-table-thead');
    await expect(header.getByText('Tên KH')).toBeVisible();
    await expect(header.getByText('Số ĐH')).toBeVisible();
    await expect(header.getByText('Vùng')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC01.png', fullPage: true });
  });

  test('TC02 — Click vào phiếu nhặt hàng xem chi tiết', async ({ page }) => {
    await page.goto('/kho/nhat-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Bấm vào nút xem chi tiết dòng đầu tiên (nút "Xem chi tiết" title)
    const viewBtn = page.locator('.ant-table-tbody .ant-table-row').first().locator('button[title="Xem chi tiết"]');
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      // URL phải chứa chi-tiet
      await expect(page).toHaveURL(/.*nhat-hang\/chi-tiet\/.*/);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC02.png', fullPage: true });
  });

  test('TC03 — Nút quay lại từ trang nhặt hàng về Kho', async ({ page }) => {
    await page.goto('/kho/nhat-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    await page.locator('.phieu-back-button').click();
    await expect(page).toHaveURL(/.*kho$/);
  });
});
