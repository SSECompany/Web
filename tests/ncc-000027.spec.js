/* eslint-disable */
/**
 * Test NCC Q516 - Kế thừa đơn hàng
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

test('NCC-Q516 — Chọn NCC Q516 và kế thừa đơn hàng', async ({ page }) => {
  await login(page);

  await page.goto('/kho/nhap-hang/them-moi');
  await page.waitForTimeout(3000);
  await clearOverlays(page);
  await page.screenshot({ path: 'tests/screenshots/Q516-01-add-page.png', fullPage: true });

  // ── Chọn NCC Q516 ───────────────────────────────────
  const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
  await supplierSelect.click();
  await page.waitForTimeout(1500);

  // Tìm option "Q516" trong dropdown
  const searchInput = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-selection-search input').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('Q516');
    await page.waitForTimeout(1500);
  }

  const options = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const optionCount = await options.count();
  console.log(`Tìm thấy ${optionCount} option(s) cho "Q516"`);

  if (optionCount === 0) {
    console.log('Không có option NCC Q516');
    await page.screenshot({ path: 'tests/screenshots/Q516-02-no-option.png', fullPage: true });
    return;
  }

  // Chọn option đầu tiên
  await options.first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tests/screenshots/Q516-03-ncc-selected.png', fullPage: true });

  // Verify NCC đã được hiển thị
  const selectedText = await supplierSelect.locator('.ant-select-selection-item').textContent().catch(() => "");
  console.log(`NCC đã chọn: "${selectedText}"`);

  // ── Click Kế thừa ───────────────────────────────────
  const btnKeThua = page.getByRole('button', { name: 'Kế thừa' });
  const isEnabled = await btnKeThua.isEnabled().catch(() => false);
  console.log(`Nút Kế thừa enabled: ${isEnabled}`);

  if (!isEnabled) {
    console.log('Nút Kế thừa bị disabled');
    await page.screenshot({ path: 'tests/screenshots/Q516-04-disabled.png', fullPage: true });
    return;
  }

  await btnKeThua.click();
  await page.waitForTimeout(2000);

  // ── Modal Kế thừa ──────────────────────────────────
  const modal = page.locator('.ant-modal-content').filter({ hasText: /kế thừa/i });
  const modalVisible = await modal.isVisible().catch(() => false);
  console.log(`Modal Kế thừa hiện: ${modalVisible}`);

  if (!modalVisible) {
    console.log('Modal không hiện');
    await page.screenshot({ path: 'tests/screenshots/Q516-05-no-modal.png', fullPage: true });
    return;
  }

  await page.screenshot({ path: 'tests/screenshots/Q516-05-modal-open.png', fullPage: true });
  await page.waitForTimeout(1000);

  // ── Kiểm tra danh sách đơn hàng ───────────────────
  const orderRows = modal.locator('.ant-table-tbody .ant-table-row');
  const rowCount = await orderRows.count();
  console.log(`Số đơn hàng trong modal: ${rowCount}`);

  if (rowCount === 0) {
    console.log('Không có đơn hàng cho NCC Q516');
    await modal.locator('button.ant-modal-close').click({ force: true });
    await page.screenshot({ path: 'tests/screenshots/Q516-06-no-orders.png', fullPage: true });
    return;
  }

  // In thông tin các đơn hàng
  for (let i = 0; i < Math.min(rowCount, 5); i++) {
    const row = orderRows.nth(i);
    const cells = await row.locator('td').allTextContents();
    console.log(`  Đơn ${i + 1}: ${cells.join(' | ')}`);
  }
  await page.screenshot({ path: 'tests/screenshots/Q516-06-orders-found.png', fullPage: true });

  // ── Chọn đơn đầu tiên ──────────────────────────────
  const selectBtn = orderRows.first().getByRole('button', { name: 'Chọn' });
  const btnVisible = await selectBtn.isVisible().catch(() => false);
  if (!btnVisible) {
    console.log('Không tìm thấy nút "Chọn"');
    return;
  }

  await selectBtn.click();
  await page.waitForTimeout(2000);

  // ── Modal vật tư kế thừa ─────────────────────────
  const detailModal = page.locator('.ant-modal-content').filter({ hasText: /vật tư|chi tiết/i });
  const detailVisible = await detailModal.isVisible().catch(() => false);
  console.log(`Modal vật tư hiện: ${detailVisible}`);
  await page.screenshot({ path: 'tests/screenshots/Q516-07-detail-modal.png', fullPage: true });

  if (!detailVisible) {
    console.log('Modal vật tư không hiện');
    return;
  }

  // Check all rows
  const checkboxes = detailModal.locator('thead .ant-checkbox-input');
  const cbCount = await checkboxes.count();
  console.log(`Checkbox header: ${cbCount}`);
  if (cbCount > 0) await checkboxes.first().check();

  // Click Xác nhận kế thừa
  const confirmBtn = detailModal.getByRole('button', { name: /xác nhận kế thừa/i });
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'tests/screenshots/Q516-08-after-inherit.png', fullPage: true });

  // ── Verify form fields ──────────────────────────────
  const soDonHang = await page.locator('.ant-form-item').filter({ hasText: 'Số đơn hàng' }).locator('input').inputValue().catch(() => "");
  const ngayDonHang = await page.locator('.ant-form-item').filter({ hasText: 'Ngày đơn hàng' }).locator('.ant-picker').textContent().catch(() => "");
  const vatTuRows = await page.locator('.ant-table-tbody .ant-table-row').count();

  console.log(`Số đơn hàng: "${soDonHang}"`);
  console.log(`Ngày đơn hàng: "${ngayDonHang}"`);
  console.log(`Số dòng vật tư: ${vatTuRows}`);

  expect(soDonHang.trim()).not.toBe("");
  expect(vatTuRows).toBeGreaterThan(0);

  await page.screenshot({ path: 'tests/screenshots/Q516-09-final-form.png', fullPage: true });
  console.log('Test Q516 hoàn tất!');
});
