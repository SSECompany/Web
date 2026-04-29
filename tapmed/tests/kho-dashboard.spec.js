/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — TRANG CHỦ KHO (Dashboard)
 * ============================================================================
 *  Module: Trang chính Kho
 *  Route:  /kho
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

test.describe('Trang chủ Kho', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang chính Kho hiển thị đúng', async ({ page }) => {
    await page.goto('/kho');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Trang phải render được (không trắng)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);

    await page.screenshot({ path: 'tests/screenshots/kho-dashboard-TC01.png', fullPage: true });
  });

  test('TC02 — Điều hướng đến các module con', async ({ page }) => {
    await page.goto('/kho');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Thử click link đến phiếu nhặt hàng nếu có
    const nhatHangLink = page.getByText('Nhặt hàng').or(page.getByText('nhặt hàng'));
    if (await nhatHangLink.first().isVisible()) {
      await nhatHangLink.first().click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/.*nhat-hang/);
      console.log('✅ Điều hướng đến Phiếu nhặt hàng thành công.');
    }

    await page.screenshot({ path: 'tests/screenshots/kho-dashboard-TC02.png', fullPage: true });
  });
});
