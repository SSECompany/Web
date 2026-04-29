/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU GIAO HÀNG
 * ============================================================================
 *  Module: Kho > Phiếu giao hàng (mobile-first card layout)
 *  Route:  /kho/giao-hang
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

test.describe('Nghiệp vụ Kho — Phiếu giao hàng', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang danh sách phiếu giao hàng hiển thị đúng', async ({ page }) => {
    await page.goto('/kho/giao-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Tiêu đề "GIAO HÀNG"
    await expect(page.locator('.giao-hang-title')).toContainText('GIAO HÀNG');

    // Kiểm tra filter tabs hiện (5 tabs)
    const tabs = page.locator('.giao-hang-filter-tab');
    await expect(tabs.first()).toBeVisible();

    // Kiểm tra tab "Xuất hàng" đang active mặc định
    await expect(page.locator('.giao-hang-filter-tab.active')).toContainText('Xuất hàng');

    await page.screenshot({ path: 'tests/screenshots/giao-hang-TC01.png', fullPage: true });
  });

  test('TC02 — Chuyển đổi giữa các tab trạng thái', async ({ page }) => {
    await page.goto('/kho/giao-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Click tab "Hoàn thành"
    await page.locator('.giao-hang-filter-tab').filter({ hasText: 'Hoàn thành' }).click();
    await page.waitForTimeout(1500);

    // Tab "Hoàn thành" phải active
    await expect(page.locator('.giao-hang-filter-tab.active')).toContainText('Hoàn thành');

    // Click tab "Thất bại"
    await page.locator('.giao-hang-filter-tab').filter({ hasText: 'Thất bại' }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.giao-hang-filter-tab.active')).toContainText('Thất bại');

    await page.screenshot({ path: 'tests/screenshots/giao-hang-TC02.png', fullPage: true });
  });

  test('TC03 — Mở card chi tiết khi click vào phiếu', async ({ page }) => {
    await page.goto('/kho/giao-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
    await page.waitForTimeout(2000);

    // Kiểm tra nếu có card
    const cards = page.locator('.giao-hang-card');
    const count = await cards.count();

    if (count > 0) {
      // Click vào header card đầu tiên để expand
      await cards.first().locator('.giao-hang-card-header').click();
      await page.waitForTimeout(500);

      // Kiểm tra nút "Xem" và "Xử lý" hiện ra
      const footer = cards.first().locator('.giao-hang-card-footer');
      await expect(footer).toBeVisible();
      await expect(footer.getByText('Xem')).toBeVisible();
      await expect(footer.getByText('Xử lý')).toBeVisible();

      console.log('✅ Expand card thành công, hiện nút Xem + Xử lý.');
    } else {
      console.log('⚠️ Không có phiếu giao hàng nào ở tab Xuất hàng.');
    }

    await page.screenshot({ path: 'tests/screenshots/giao-hang-TC03.png', fullPage: true });
  });

  test('TC04 — Mở bộ lọc (Drawer) và đóng', async ({ page }) => {
    await page.goto('/kho/giao-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Click nút Floating Filter Button
    await page.locator('.giao-hang-fab').click();
    await page.waitForTimeout(500);

    // Kiểm tra Drawer mở ra
    const drawer = page.locator('.ant-drawer-content');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Bộ lọc phiếu giao hàng')).toBeVisible();

    // Kiểm tra các trường filter
    await expect(drawer.getByText('Trạng thái')).toBeVisible();
    await expect(drawer.getByText('Từ ngày')).toBeVisible();
    await expect(drawer.getByText('Đến ngày')).toBeVisible();

    // Đóng Drawer
    await page.locator('.ant-drawer-close').click();
    await expect(drawer).toBeHidden();

    console.log('✅ Drawer bộ lọc mở/đóng thành công.');
  });

  test('TC05 — Nút quay lại về trang Kho', async ({ page }) => {
    await page.goto('/kho/giao-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    await page.locator('.giao-hang-back-btn').click();
    await expect(page).toHaveURL(/.*kho$/);
  });
});
