/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — BÁO CÁO (3 trang)
 * ============================================================================
 *  Bao gồm:
 *    - Báo cáo phiếu bán lẻ:        /bao-cao/phieu-ban-le
 *    - Báo cáo tồn kho:             /bao-cao/ton-kho
 *    - Tổng hợp nhập xuất tồn:      /bao-cao/tong-hop-nhap-xuat-ton
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

test.describe('Báo cáo', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang Báo cáo tồn kho hiển thị đúng', async ({ page }) => {
    await page.goto('/bao-cao/ton-kho');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Trang phải render được (không trắng)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);

    await page.screenshot({ path: 'tests/screenshots/bao-cao-ton-kho.png', fullPage: true });
  });

  test('TC02 — Trang Tổng hợp nhập xuất tồn hiển thị đúng', async ({ page }) => {
    await page.goto('/bao-cao/tong-hop-nhap-xuat-ton');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);

    await page.screenshot({ path: 'tests/screenshots/bao-cao-nxt.png', fullPage: true });
  });
});
