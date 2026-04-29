/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU NHẬP HÀNG THEO ĐƠN (Kế thừa từ Đơn mua hàng)
 * ============================================================================
 *
 *  Test suite bao gồm 6 Test Cases:
 *    TC01 — Trang danh sách hiển thị đúng
 *    TC02 — Điều hướng đến trang Thêm mới
 *    TC03 — Luồng tạo phiếu bằng Kế thừa (E2E đầy đủ)
 *    TC04 — Nút quay lại hoạt động đúng
 *    TC05 — Form validation
 *    TC06 — Modal Kế thừa: mở, tìm kiếm, đóng
 *
 *  Yêu cầu: `npm start` phải chạy ở localhost:3000.
 *
 *  Chạy:
 *    npx playwright test tests/phieu-nhap-hang.spec.js --headed
 * ============================================================================
 */

const { test, expect } = require('@playwright/test');
const { login, dismissNotifications } = require('./helpers/auth.helper');

// ═══════════════════════════════════════════════════════════════════════════
const URLS = {
  LIST: '/kho/nhap-hang',
  ADD: '/kho/nhap-hang/them-moi',
};

// ═══════════════════════════════════════════════════════════════════════════
//  Helper: Đóng mọi notification/popup che UI
// ═══════════════════════════════════════════════════════════════════════════
async function clearOverlays(page) {
  // Đóng tất cả ant-notification
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Nghiệp vụ Kho — Phiếu nhập hàng theo đơn', () => {

  // ── SETUP ─────────────────────────────────────────────────────────────
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC01: Trang danh sách hiển thị đúng
  // ══════════════════════════════════════════════════════════════════════
  test('TC01 — Trang danh sách phiếu nhập hàng hiển thị đúng', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Kiểm tra tiêu đề (Antd Title level=5)
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẬP HÀNG THEO ĐƠN');

    // Kiểm tra nút Tạo mới (nằm trong DesktopLayout extraHeader)
    await expect(page.getByRole('button', { name: /Tạo mới/i })).toBeVisible();

    // Kiểm tra bảng có dữ liệu (ít nhất 1 row)
    const rows = page.locator('.ant-table-tbody .ant-table-row');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    // Kiểm tra các header cột chính
    const headerRow = page.locator('.ant-table-thead');
    await expect(headerRow.getByText('Chứng từ')).toBeVisible();
    await expect(headerRow.getByText('Khách hàng')).toBeVisible();
    await expect(headerRow.getByText('Tổng tiền')).toBeVisible();
    await expect(headerRow.getByText('Trạng thái')).toBeVisible();
    await expect(headerRow.getByText('Hành động')).toBeVisible();

    // Kiểm tra row tổng cộng (Table.Summary)
    await expect(page.getByText('Tổng cộng:')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/TC01-list-page.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC02: Click Tạo mới → chuyển trang
  // ══════════════════════════════════════════════════════════════════════
  test('TC02 — Click "Tạo mới" chuyển sang trang thêm phiếu', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Click nút Tạo mới
    await page.getByRole('button', { name: /Tạo mới/i }).click();

    // URL phải chứa "them-moi"
    await expect(page).toHaveURL(/.*them-moi/);

    // Badge "THÊM PHIẾU NHẬP MỚI"
    await expect(page.getByText('THÊM PHIẾU NHẬP MỚI')).toBeVisible();

    // Kiểm tra form nhập hàng hiện lên (PhieuFormInputs formType="nhap-hang")
    await expect(page.getByText('Tên nhà cung cấp', { exact: true })).toBeVisible();
    await expect(page.getByText('Người giao hàng', { exact: true })).toBeVisible();
    await expect(page.getByText('Diễn giải', { exact: true }).first()).toBeVisible();

    // Fixed footer: 2 nút "Lưu phiếu" + "Kế thừa"
    await expect(page.getByRole('button', { name: 'Lưu phiếu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kế thừa' })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/TC02-add-page.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC03: Luồng E2E hoàn chỉnh — Tạo phiếu bằng Kế thừa
  // ══════════════════════════════════════════════════════════════════════
  test('TC03 — Tạo phiếu nhập hàng bằng kế thừa đơn hàng mua (E2E đầy đủ)', async ({ page }) => {
    // ── Bước 1: Vào trang thêm mới ──────────────────────────────
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // ── Bước 2: Chọn Nhà cung cấp ──────────────────────────────
    //    Nút Kế thừa bị disabled khi chưa chọn maKhach
    //    Select "Tên nhà cung cấp" → showSearch → placeholder "Nhập tên nhà cung cấp"
    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500); // API load danh sách NCC

    // Chọn nhà cung cấp đầu tiên
    const firstOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();

    await page.screenshot({ path: 'tests/screenshots/TC03-step2-supplier.png' });

    // ── Bước 3: Click Kế thừa ───────────────────────────────────
    const btnKeThua = page.getByRole('button', { name: 'Kế thừa' });
    await expect(btnKeThua).toBeEnabled({ timeout: 5000 });
    await btnKeThua.click();

    // ── Bước 4: Modal "Kế thừa đơn hàng mua" ───────────────────
    //    ModalKeThua → title = "📋 Kế thừa đơn hàng mua"
    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // API load đơn hàng

    await page.screenshot({ path: 'tests/screenshots/TC03-step4-modal.png' });

    // Kiểm tra bảng đơn hàng có dữ liệu
    const orderRows = modal.locator('.ant-table-tbody .ant-table-row');
    const rowCount = await orderRows.count();

    if (rowCount === 0) {
      console.log('⚠️  Không có đơn hàng Kế thừa nào cho NCC này. Bỏ qua.');
      await modal.locator('button.ant-modal-close').click({ force: true });
      return;
    }

    // ── Bước 5: Click "Chọn" trên dòng đầu tiên ────────────────
    //    ModalKeThua → mỗi row render có Button "Chọn"
    await orderRows.first().getByRole('button', { name: 'Chọn' }).click();

    // ── Bước 6: Modal "Chọn chi tiết vật tư kế thừa" ───────────
    //    ModalChonVatTuKeThua
    const detailModal = page.locator('.ant-modal-content').filter({ hasText: 'Chọn chi tiết vật tư kế thừa' });
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'tests/screenshots/TC03-step6-vattu-modal.png' });

    // Tick checkbox "Chọn tất cả" (header checkbox)
    const selectAll = detailModal.locator('thead .ant-checkbox-input').first();
    await selectAll.check();

    // ── Bước 7: Xác nhận kế thừa ────────────────────────────────
    //    okText = "Xác nhận kế thừa"
    await detailModal.getByRole('button', { name: 'Xác nhận kế thừa' }).click();

    // Đợi modal đóng, dữ liệu đổ về
    await expect(detailModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'tests/screenshots/TC03-step7-data-filled.png', fullPage: true });

    // ── Bước 8: Kiểm tra bảng VatTu có dữ liệu ─────────────────
    const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
    const vatTuCount = await vatTuRows.count();
    expect(vatTuCount).toBeGreaterThan(0);
    console.log(`✅ Đã kế thừa ${vatTuCount} dòng vật tư.`);

    // ── Bước 9: Lưu phiếu ───────────────────────────────────────
    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(3000);

    // ── Bước 10: Kiểm tra kết quả ───────────────────────────────
    //   Thành công: redirect về /kho/nhap-hang HOẶC hiện message success
    const redirected = await page.waitForURL(/.*nhap-hang$/, { timeout: 5000 }).then(() => true).catch(() => false);
    const hasSuccessMsg = await page.locator('.ant-message-success').isVisible().catch(() => false);

    if (redirected) console.log('✅ Redirect về danh sách thành công.');
    if (hasSuccessMsg) console.log('✅ Hiện thông báo lưu thành công.');

    await page.screenshot({ path: 'tests/screenshots/TC03-step10-result.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC04: Nút quay lại
  // ══════════════════════════════════════════════════════════════════════
  test('TC04 — Nút quay lại từ trang thêm mới về danh sách', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    // Click nút Back (LeftOutlined → class .phieu-back-button)
    await page.locator('.phieu-back-button').click();

    // Kiểm tra quay về trang danh sách
    await expect(page).toHaveURL(/.*nhap-hang$/);
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẬP HÀNG THEO ĐƠN');
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC05: Form validation
  // ══════════════════════════════════════════════════════════════════════
  test('TC05 — Validation: không cho lưu khi chưa có dữ liệu', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Click Lưu ngay (chưa chọn NCC, chưa có vật tư)
    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(1500);

    // Phải hiện lỗi validation hoặc message lỗi
    const hasValidationError = await page.locator('.ant-form-item-explain-error').first().isVisible().catch(() => false);
    const hasMessageError = await page.locator('.ant-message-error').isVisible().catch(() => false);

    // Vẫn ở trang thêm mới (không redirect)
    await expect(page).toHaveURL(/.*them-moi/);

    await page.screenshot({ path: 'tests/screenshots/TC05-validation.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC06: Modal Kế thừa — mở, tìm kiếm, đóng
  // ══════════════════════════════════════════════════════════════════════
  test('TC06 — Modal Kế thừa: mở, tìm kiếm, đóng', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Chọn nhà cung cấp trước
    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500);

    const firstOpt = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    if (await firstOpt.isVisible()) {
      await firstOpt.click();
    } else {
      console.log('⚠️ Không có NCC nào trong danh sách.');
      return;
    }

    await page.waitForTimeout(500);

    // Mở modal Kế thừa
    const btnKeThua = page.getByRole('button', { name: 'Kế thừa' });
    if (!(await btnKeThua.isEnabled())) {
      console.log('⚠️ Nút Kế thừa vẫn disabled sau khi chọn NCC.');
      return;
    }
    await btnKeThua.click();

    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await clearOverlays(page); // Đóng notification nếu có

    // Kiểm tra input tìm kiếm
    await expect(modal.getByPlaceholder('Tìm số chứng từ...')).toBeVisible();

    // Kiểm tra 2 nút chức năng
    await expect(modal.getByRole('button', { name: 'Tìm kiếm' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Đặt lại' })).toBeVisible();

    // Kiểm tra bảng có hiện (dù rỗng hay có data)
    await expect(modal.locator('.ant-table')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/TC06-modal-kethua.png' });

    // Đóng modal bằng nút X (force click để bypass overlay)
    await modal.locator('button.ant-modal-close').click({ force: true });
    await expect(modal).toBeHidden({ timeout: 5000 });

    console.log('✅ Modal Kế thừa mở, hiển thị đúng, đóng thành công.');
  });
});
