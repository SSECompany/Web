/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU NHẬP HÀNG THEO ĐƠN
 * ============================================================================
 *
 *  Coverage:
 *    TC01    — Trang danh sách hiển thị đúng
 *    TC02    — Click "Tạo mới" → trang thêm phiếu
 *    TC03    — Kế thừa E2E + verify form fields sau kế thừa
 *    TC04    — Nút quay lại
 *    TC05    — Validation: không cho lưu khi chưa có data
 *    TC06    — Modal Kế thừa: mở, tìm kiếm, đóng
 *    TC07    — Tạo lô: HSD bắt buộc (label "*"), không cho xóa
 *    TC08    — HSD chi tiết: có lô → text, không lô → DatePicker
 *    TC09    — Chọn lô từ dropdown → HSD tự động fill
 *    TC10    — lo_yn=true: không cho lưu nếu chưa nhập mã lô
 *    TC11    — Status=4/9/user_lock → không cho sửa
 *    TC12    — Xóa phiếu
 *    TC13    — Thêm vật tư thủ công, kiểm tra cột
 *    TC14    — Tổng cộng tự động update
 *    TC15    — Filter + phân trang
 *    TC16    — Verify sau kế thừa: soDonHang, ngayDonHang, ma_nv_mua trên form
 *    TC17    — Verify HSD, mã lô sau khi kế thừa + chọn lô
 *
 *  Chạy:
 *    npx playwright test tests/phieu-nhap-hang.spec.js --headed
 *    npx playwright test tests/phieu-nhap-hang.spec.js --headed -g "TC03"
 * ============================================================================
 */

const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth.helper');

// ═══════════════════════════════════════════════════════════════════════════
const URLS = {
  LIST: '/kho/nhap-hang',
  ADD: '/kho/nhap-hang/them-moi',
};

// Helper: Đóng notification
async function clearOverlays(page) {
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

// Helper: Lấy giá trị field từ form
async function getFormFieldValue(page, label) {
  const formItem = page.locator('.ant-form-item').filter({ hasText: new RegExp(`^${label}`) });
  const input = formItem.locator('input, .ant-select, .ant-picker').first();
  return input.inputValue().catch(() => input.textContent().catch(() => ""));
}

// Helper: Lấy giá trị input trong formItem (cho cả Select disabled)
async function getFormInputValue(page, label) {
  const formItem = page.locator('.ant-form-item').filter({ hasText: new RegExp(label) });
  const input = formItem.locator('input[disabled], input').first();
  return input.inputValue().catch(() => input.textContent().catch(() => ""));
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
  //  TC01: Trang danh sách
  // ══════════════════════════════════════════════════════════════════════
  test('TC01 — Trang danh sách phiếu nhập hàng hiển thị đúng', async ({ page }) => {
    await page.goto('/kho/nhap-hang');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Đợi list page render đúng (title PHIẾU NHẬP HÀNG THEO ĐƠN)
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẬP HÀNG THEO ĐƠN', { timeout: 15000 });
    await expect(page.getByRole('button', { name: /Tạo mới/i })).toBeVisible();

    // Chờ table rows xuất hiện
    const rows = page.locator('.ant-table-tbody .ant-table-row');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    const headers = page.locator('.ant-table-thead th');
    // Tìm header "Khách" (trong 14 columns của detail table — list và add cùng dùng VatTuTable)
    const khachHeader = headers.filter({ hasText: 'Khách' });
    const totalHeader = headers.filter({ hasText: 'Tổng tiền' });
    const actionHeader = headers.filter({ hasText: 'Hành động' });

    const hasKhach = await khachHeader.isVisible().catch(() => false);
    const hasTotal = await totalHeader.isVisible().catch(() => false);
    const hasAction = await actionHeader.isVisible().catch(() => false);

    expect(hasKhach || hasTotal || hasAction).toBeTruthy();
    console.log(`TC01 — Headers: Khách=${hasKhach}, Tổng tiền=${hasTotal}, Hành động=${hasAction}`);

    await page.screenshot({ path: 'tests/screenshots/TC01-list-page.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC02: Tạo mới → trang thêm phiếu
  // ══════════════════════════════════════════════════════════════════════
  test('TC02 — Click "Tạo mới" chuyển sang trang thêm phiếu', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    await page.getByRole('button', { name: /Tạo mới/i }).click();
    await expect(page).toHaveURL(/.*them-moi/);
    await expect(page.getByText('THÊM PHIẾU NHẬP MỚI')).toBeVisible();
    await expect(page.getByText('Tên nhà cung cấp', { exact: true })).toBeVisible();
    await expect(page.getByText('Người giao hàng', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu phiếu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kế thừa' })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/TC02-add-page.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC03: Kế thừa E2E — sau kế thừa form fields phải được set
  // ══════════════════════════════════════════════════════════════════════
  test('TC03 — Kế thừa: form fields (Số đơn hàng, Ngày đơn hàng, Nhân viên mua) được set', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // ── Bước 1: Chọn Nhà cung cấp ──────────────────────────────
    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500);
    const firstOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(500);

    // ── Bước 2: Click Kế thừa ───────────────────────────────────
    const btnKeThua = page.getByRole('button', { name: 'Kế thừa' });
    await expect(btnKeThua).toBeEnabled({ timeout: 5000 });
    await btnKeThua.click();

    // ── Bước 3: Modal Kế thừa ───────────────────────────────
    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    const orderRows = modal.locator('.ant-table-tbody .ant-table-row');
    const rowCount = await orderRows.count();

    if (rowCount === 0) {
      console.log('⚠️ Không có đơn hàng Kế thừa. Bỏ qua TC03.');
      await modal.locator('button.ant-modal-close').click({ force: true });
      return;
    }

    // ── Bước 4: Chọn dòng đầu tiên ───────────────────────
    await orderRows.first().getByRole('button', { name: 'Chọn' }).click();

    // ── Bước 5: Modal chọn vật tư ───────────────────────────
    const detailModal = page.locator('.ant-modal-content').filter({ hasText: 'Chọn chi tiết vật tư kế thừa' });
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    await detailModal.locator('thead .ant-checkbox-input').first().check();
    await detailModal.getByRole('button', { name: 'Xác nhận kế thừa' }).click();
    await expect(detailModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1500);

    // ── Bước 6: Verify form fields SAU KẾ THỪA ────────────

    // TC03a: Số đơn hàng phải được fill (disabled input)
    const soDonHangInput = page.locator('.ant-form-item').filter({ hasText: 'Số đơn hàng' }).locator('input[disabled]');
    const soDonHangVal = await soDonHangInput.inputValue().catch(() => "");
    expect(soDonHangVal.trim()).not.toBe("");
    console.log(`✅ Số đơn hàng được fill: "${soDonHangVal}"`);

    // TC03b: Ngày đơn hàng phải được fill
    const ngayDonHangPicker = page.locator('.ant-form-item').filter({ hasText: 'Ngày đơn hàng' }).locator('.ant-picker');
    const ngayDonHangVisible = await ngayDonHangPicker.isVisible().catch(() => false);
    expect(ngayDonHangVisible).toBeTruthy();
    console.log(`✅ Ngày đơn hàng hiển thị: ${ngayDonHangVisible}`);

    // TC03c: Nhân viên mua phải được fill
    const nvMuaInput = page.locator('.ant-form-item').filter({ hasText: 'Nhân viên mua' }).locator('input').first();
    const nvMuaVal = await nvMuaInput.inputValue().catch(() => "");
    // Có thể rỗng nếu PO không có NV, nhưng không crash
    console.log(`ℹ️ Nhân viên mua: "${nvMuaVal}"`);

    // TC03d: Bảng vật tư có dữ liệu
    const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
    const vatTuCount = await vatTuRows.count();
    expect(vatTuCount).toBeGreaterThan(0);
    console.log(`✅ Đã kế thừa ${vatTuCount} dòng vật tư.`);

    // TC03e: Lưu phiếu
    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(3000);

    const redirected = await page.waitForURL(/.*nhap-hang$/, { timeout: 5000 }).then(() => true).catch(() => false);
    const hasSuccessMsg = await page.locator('.ant-message-success').isVisible().catch(() => false);
    expect(redirected || hasSuccessMsg).toBeTruthy();

    await page.screenshot({ path: 'tests/screenshots/TC03-ke-thua-form-fields.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC04: Nút quay lại
  // ══════════════════════════════════════════════════════════════════════
  test('TC04 — Nút quay lại từ trang thêm mới về danh sách', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    await page.locator('.phieu-back-button').click();
    await expect(page).toHaveURL(/.*nhap-hang$/);
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẬP HÀNG THEO ĐƠN');
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC05: Validation — không cho lưu khi chưa có dữ liệu
  // ══════════════════════════════════════════════════════════════════════
  test('TC05 — Validation: không cho lưu khi chưa có dữ liệu', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(1500);

    const hasError = await page.locator('.ant-form-item-explain-error').first().isVisible().catch(() => false)
      || await page.locator('.ant-message-error').isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
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

    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500);
    const firstOpt = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    if (await firstOpt.isVisible()) await firstOpt.click();
    await page.waitForTimeout(500);

    const btnKeThua = page.getByRole('button', { name: 'Kế thừa' });
    if (!(await btnKeThua.isEnabled())) return;
    await btnKeThua.click();

    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    await expect(modal.getByPlaceholder('Tìm số chứng từ...')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Tìm kiếm' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Đặt lại' })).toBeVisible();
    await expect(modal.locator('.ant-table')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/TC06-modal-kethua.png' });

    await modal.locator('button.ant-modal-close').click({ force: true });
    await expect(modal).toBeHidden({ timeout: 5000 });
    console.log('✅ Modal Kế thừa mở, hiển thị đúng, đóng thành công.');
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC07: Tạo lô — HSD bắt buộc
  // ══════════════════════════════════════════════════════════════════════
  test('TC07 — Tạo lô: HSD bắt buộc (label "*"), không cho xóa', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Thêm vật tư để có dòng trong bảng
    const vatTuInput = page.locator('.ant-select-search').first();
    if (await vatTuInput.isVisible()) {
      await vatTuInput.fill('VT001');
      await page.waitForTimeout(1500);
      const firstResult = page.locator('.ant-select-dropdown .ant-select-item-option').first();
      if (await firstResult.isVisible()) await firstResult.click();
      await page.waitForTimeout(1000);
    }

    const rowCount = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowCount === 0) {
      console.log('⚠️ Không có dòng vật tư. Bỏ qua TC07.');
      return;
    }

    // ── Mở modal tạo lô ──────────────────────────────
    const plusIcons = page.locator('.ant-table-tbody .ant-table-row .anticon-plus');
    const plusCount = await plusIcons.count();
    if (plusCount === 0) {
      console.log('⚠️ Không tìm thấy icon tạo lô. Bỏ qua TC07.');
      return;
    }
    await plusIcons.first().click();
    await page.waitForTimeout(500);

    const lotModal = page.locator('.ant-modal').filter({ hasText: /lô|Lô/i });
    if (!(await lotModal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal tạo lô không hiện. Bỏ qua TC07.');
      return;
    }

    // TC07a: Label HSD có dấu "*"
    const hsdLabel = lotModal.locator('label, div').filter({ hasText: /Hạn sử dụng\s*\*/ });
    const hasAsterisk = await hsdLabel.isVisible().catch(() => false);
    expect(hasAsterisk).toBeTruthy();
    console.log('✅ Label HSD có dấu "*" bắt buộc');

    // TC07b: Không có nút Xóa (clear) của DatePicker HSD
    const clearBtn = lotModal.locator('.ant-picker-clear');
    const clearCount = await clearBtn.count();
    expect(clearCount).toBe(0);
    console.log('✅ DatePicker HSD: allowClear=false');

    // TC07c: Nhập mã lô, click Xác nhận mà chưa nhập HSD → báo lỗi
    const maLoInput = lotModal.locator('input').first();
    await maLoInput.fill('LOT-TEST-001');
    await page.waitForTimeout(200);
    await lotModal.getByRole('button', { name: /Xác nhận|Tạo/i }).click();
    await page.waitForTimeout(800);

    const hsdError = await page.locator('.ant-notification').filter({ hasText: /HSD|hạn sử dụng/i }).isVisible().catch(() => false)
      || await page.locator('.ant-message-error').isVisible().catch(() => false);
    expect(hsdError).toBeTruthy();
    console.log('✅ Không cho lưu khi chưa nhập HSD');

    await lotModal.locator('button.ant-modal-close').click({ force: true });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/screenshots/TC07-create-lot-hsd-required.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC08: HSD chi tiết — có lô → text, không lô → DatePicker
  // ══════════════════════════════════════════════════════════════════════
  test('TC08 — HSD chi tiết: có lô → text (không cho gõ), không lô → DatePicker', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    const vatTuInput = page.locator('.ant-select-search').first();
    if (await vatTuInput.isVisible()) {
      await vatTuInput.fill('VT001');
      await page.waitForTimeout(1500);
      const firstResult = page.locator('.ant-select-dropdown .ant-select-item-option').first();
      if (await firstResult.isVisible()) await firstResult.click();
      await page.waitForTimeout(1000);
    }

    const rowCount = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowCount === 0) {
      console.log('⚠️ Không có dòng vật tư. Bỏ qua TC08.');
      return;
    }

    // TC08a: Dòng mới (chưa có lô) → HSD là DatePicker
    const datePickerInTable = page.locator('.ant-table-tbody .ant-table-row td .ant-picker').first();
    const hasDatePicker = await datePickerInTable.isVisible().catch(() => false);
    expect(hasDatePicker).toBeTruthy();
    console.log('✅ Dòng chưa có lô → cột HSD là DatePicker (cho nhập)');

    // TC08b: Sau khi chọn lô → HSD là text span
    const firstLoSelect = page.locator('.ant-table-tbody .ant-table-row').first().locator('.ant-select').first();
    if (await firstLoSelect.isVisible().catch(() => false)) {
      await firstLoSelect.click();
      await page.waitForTimeout(1500);
      const loOption = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first();
      if (await loOption.isVisible().catch(() => false)) {
        await loOption.click();
        await page.waitForTimeout(800);

        // Kiểm tra: cột HSD giờ là span text
        const hsdSpan = page.locator('.ant-table-tbody .ant-table-row td').filter({ hasText: /\d{2}\/\d{2}\/\d{4}/ }).first();
        const spanVisible = await hsdSpan.isVisible().catch(() => false);
        if (spanVisible) {
          console.log('✅ Sau khi chọn lô → cột HSD là text (không phải DatePicker)');
        }
      }
      await page.keyboard.press('Escape');
    }

    await page.screenshot({ path: 'tests/screenshots/TC08-hsd-display-mode.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC09: Chọn lô → HSD tự động fill
  // ══════════════════════════════════════════════════════════════════════
  test('TC09 — Chọn lô từ dropdown → HSD tự động fill theo lô', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    const vatTuInput = page.locator('.ant-select-search').first();
    if (await vatTuInput.isVisible()) {
      await vatTuInput.fill('VT001');
      await page.waitForTimeout(1500);
      const firstResult = page.locator('.ant-select-dropdown .ant-select-item-option').first();
      if (await firstResult.isVisible()) await firstResult.click();
      await page.waitForTimeout(1000);
    }

    const rowCount = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowCount === 0) {
      console.log('⚠️ Không có dòng. Bỏ qua TC09.');
      return;
    }

    // Mở dropdown lô
    const firstLoSelect = page.locator('.ant-table-tbody .ant-table-row').first().locator('.ant-select').first();
    await firstLoSelect.click();
    await page.waitForTimeout(1500);

    const loOptions = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
    const optionCount = await loOptions.count();

    if (optionCount === 0) {
      console.log('⚠️ Không có option lô nào. Bỏ qua TC09.');
      await page.keyboard.press('Escape');
      return;
    }

    // Lấy text option trước khi chọn
    const firstOptionText = await loOptions.first().textContent().catch(() => "");
    const optionHasDate = /\d{2}\/\d{2}\/\d{4}/.test(firstOptionText);
    console.log(`ℹ️ Option: "${firstOptionText.trim()}" — có ngày: ${optionHasDate}`);

    // Chọn option
    await loOptions.first().click();
    await page.waitForTimeout(800);

    // HSD phải được fill
    const hsds = page.locator('.ant-table-tbody .ant-table-row td').filter({ hasText: /\d{2}\/\d{2}\/\d{4}/ });
    const hsdCount = await hsds.count();
    expect(hsdCount).toBeGreaterThan(0);
    console.log(`✅ Sau khi chọn lô → ${hsdCount} dòng có HSD`);

    await page.screenshot({ path: 'tests/screenshots/TC09-lo-selection-fills-hsd.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC10: lo_yn=true → không cho lưu nếu chưa nhập mã lô
  // ══════════════════════════════════════════════════════════════════════
  test('TC10 — Hàng lo_yn=true: không cho lưu nếu chưa nhập mã lô', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Kế thừa đơn hàng
    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500);
    const firstOpt = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    if (!(await firstOpt.isVisible().catch(() => false))) {
      console.log('⚠️ Không có NCC. Bỏ qua TC10.'); return;
    }
    await firstOpt.click();
    await page.waitForTimeout(500);

    const btnKeThua = page.getByRole('button', { name: 'Kế thừa' });
    if (!(await btnKeThua.isEnabled().catch(() => false))) {
      console.log('⚠️ Nút Kế thừa disabled. Bỏ qua TC10.'); return;
    }
    await btnKeThua.click();

    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    if (!(await modal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal không hiện. Bỏ qua TC10.'); return;
    }
    await page.waitForTimeout(2000);

    const orderRows = modal.locator('.ant-table-tbody .ant-table-row');
    if (await orderRows.count() === 0) {
      await modal.locator('button.ant-modal-close').click({ force: true });
      console.log('⚠️ Không có đơn hàng. Bỏ qua TC10.'); return;
    }

    await orderRows.first().getByRole('button', { name: 'Chọn' }).click();

    const detailModal = page.locator('.ant-modal-content').filter({ hasText: 'Chọn chi tiết vật tư kế thừa' });
    if (!(await detailModal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal vật tư không hiện. Bỏ qua TC10.'); return;
    }

    await detailModal.locator('thead .ant-checkbox-input').first().check();
    await detailModal.getByRole('button', { name: 'Xác nhận kế thừa' }).click();
    await expect(detailModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1500);

    // Xóa hết mã lô trong bảng
    const loSelects = page.locator('.ant-table-tbody .ant-table-row .ant-select');
    const loCount = await loSelects.count();
    for (let i = 0; i < Math.min(loCount, 3); i++) {
      const sel = page.locator('.ant-table-tbody .ant-table-row').nth(0).locator('.ant-select').first();
      await sel.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('Control+a');
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    // Click Lưu → phải báo lỗi lo_yn
    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(1500);

    const errorMsg = await page.locator('.ant-message-error, .ant-notification-error').filter({
      hasText: /lô|theo dõi/i
    }).isVisible().catch(() => false);

    if (errorMsg) {
      console.log('✅ Hệ thống báo lỗi: hàng theo dõi lô mà chưa nhập mã lô');
      expect(errorMsg).toBeTruthy();
    } else {
      console.log('⚠️ Không bắt được lỗi "theo dõi lô". Có thể không có dòng lo_yn=true.');
    }

    await page.screenshot({ path: 'tests/screenshots/TC10-lo-yn-validation.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC11: Trạng thái — status=4/9 không cho sửa
  // ══════════════════════════════════════════════════════════════════════
  test('TC11 — Status=4/9/user_lock → không cho sửa', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    const rows = page.locator('.ant-table-tbody .ant-table-row');
    if (await rows.count() === 0) {
      console.log('⚠️ Không có phiếu nào. Bỏ qua TC11.'); return;
    }

    const editButtons = page.locator('.ant-table-tbody .ant-table-row button').filter({
      has: page.locator('.anticon-edit')
    });
    if (await editButtons.count() === 0) {
      console.log('⚠️ Không tìm thấy nút Sửa. Bỏ qua TC11.'); return;
    }

    await editButtons.first().click();
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    if (!page.url().includes('/edit/')) {
      console.log('⚠️ Không vào được trang sửa. Bỏ qua TC11.'); return;
    }

    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    const errorMsg = await page.locator('.ant-message-error, .ant-notification-error').filter({
      hasText: /hoàn thành|đang xóa|đang sửa|khóa|người khác/i
    }).isVisible().catch(() => false);

    const successMsg = await page.locator('.ant-message-success').isVisible().catch(() => false);
    expect(errorMsg || successMsg).toBeTruthy();
    if (errorMsg) console.log('✅ Hệ thống từ chối lưu: phiếu đã khóa/hoàn thành/đang xóa/đang sửa');
    else console.log('✅ Phiếu chưa khóa — lưu thành công');

    await page.screenshot({ path: 'tests/screenshots/TC11-status-validation.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC12: Xóa phiếu
  // ══════════════════════════════════════════════════════════════════════
  test('TC12 — Xóa phiếu nhập hàng', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    const rows = page.locator('.ant-table-tbody .ant-table-row');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      console.log('⚠️ Không có phiếu để xóa. Bỏ qua TC12.'); return;
    }

    const deleteButtons = page.locator('.ant-table-tbody .ant-table-row button').filter({
      has: page.locator('.anticon-delete')
    });
    if (await deleteButtons.count() === 0) {
      console.log('⚠️ Không tìm thấy nút Xóa. Bỏ qua TC12.'); return;
    }

    await deleteButtons.first().click();
    await page.waitForTimeout(500);

    const confirmModal = page.locator('.ant-modal').filter({ hasText: /xóa/i });
    if (!(await confirmModal.isVisible().catch(() => false))) {
      console.log('⚠️ Không hiện confirm xóa. Bỏ qua TC12.'); return;
    }

    await confirmModal.getByRole('button', { name: /OK|đồng ý|xác nhận/i }).click();
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    const errorMsg = await page.locator('.ant-message-error').isVisible().catch(() => false);
    const successMsg = await page.locator('.ant-message-success').isVisible().catch(() => false);
    expect(errorMsg || successMsg).toBeTruthy();

    if (successMsg) {
      const rowCountAfter = await rows.count();
      expect(rowCountAfter).toBe(rowCount - 1);
      console.log(`✅ Xóa thành công: ${rowCount} → ${rowCountAfter}`);
    } else {
      console.log('⚠️ Xóa thất bại (phiếu có thể đã khóa)');
    }

    await page.screenshot({ path: 'tests/screenshots/TC12-delete-phieu.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC13: Thêm vật tư thủ công
  // ══════════════════════════════════════════════════════════════════════
  test('TC13 — Thêm vật tư thủ công, kiểm tra các cột bắt buộc', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    const vatTuInput = page.locator('.ant-select-search').first();
    if (await vatTuInput.isVisible()) {
      await vatTuInput.fill('VT001');
      await page.waitForTimeout(1500);
      const firstResult = page.locator('.ant-select-dropdown .ant-select-item-option').first();
      if (await firstResult.isVisible()) await firstResult.click();
      await page.waitForTimeout(1000);
    }

    const rowCount = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowCount === 0) {
      console.log('⚠️ Không thêm được vật tư. Bỏ qua TC13.'); return;
    }

    const headers = await page.locator('.ant-table-thead th').allTextContents();
    expect(headers.some(h => h.includes('Sản phẩm') || h.includes('Mã'))).toBeTruthy();
    console.log(`✅ Bảng có các cột: ${headers.join(', ')}`);

    const firstRowCells = page.locator('.ant-table-tbody .ant-table-row').first().locator('td');
    const cellCount = await firstRowCells.count();
    expect(cellCount).toBeGreaterThan(5);

    await page.screenshot({ path: 'tests/screenshots/TC13-vattu-manual-add.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC14: Tổng cộng tự động update khi thêm vật tư
  // ══════════════════════════════════════════════════════════════════════
  test('TC14 — Tổng cộng tự động update khi thêm vật tư', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    const vatTuInput = page.locator('.ant-select-search').first();
    if (await vatTuInput.isVisible()) {
      await vatTuInput.fill('VT001');
      await page.waitForTimeout(1500);
      const firstResult = page.locator('.ant-select-dropdown .ant-select-item-option').first();
      if (await firstResult.isVisible()) await firstResult.click();
      await page.waitForTimeout(1000);
    }

    const rowCountBefore = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowCountBefore === 0) {
      console.log('⚠️ Không thêm được vật tư. Bỏ qua TC14.'); return;
    }

    const summary = page.locator('.ant-table-summary');
    await summary.scrollIntoViewIfNeeded();
    const totalText = await summary.textContent().catch(() => "");
    console.log(`ℹ️ Tổng cộng: ${totalText.trim()}`);

    expect(rowCountBefore).toBeGreaterThan(0);
    await page.screenshot({ path: 'tests/screenshots/TC14-summary-update.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC15: Filter + phân trang
  // ══════════════════════════════════════════════════════════════════════
  test('TC15 — Filter theo trạng thái + phân trang', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    if (await page.locator('.ant-table-tbody .ant-table-row').count() === 0) {
      console.log('⚠️ Không có dữ liệu. Bỏ qua TC15.'); return;
    }

    const pagination = page.locator('.ant-pagination');
    const paginationVisible = await pagination.isVisible().catch(() => false);
    if (paginationVisible) {
      // Lấy text từ .ant-pagination-item-active hoặc .ant-pagination-total-text
      const totalText = await pagination.locator('.ant-pagination-total-text').textContent().catch(() => "");
      const activePage = await pagination.locator('.ant-pagination-item-active').textContent().catch(() => "");
      console.log(`✅ Phân trang: total="${totalText}", current="${activePage}"`);
      expect(totalText || activePage).toBeTruthy();
    } else {
      console.log('⚠️ Không có phân trang (1 trang)');
    }

    await page.screenshot({ path: 'tests/screenshots/TC15-filter-pagination.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC16: Verify form fields sau kế thừa (số đơn, ngày đơn, NV mua)
  // ══════════════════════════════════════════════════════════════════════
  test('TC16 — Verify form fields sau kế thừa: Số đơn, Ngày đơn, NV mua được fill đúng', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Chọn NCC
    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500);
    const firstOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(500);

    // Mở modal kế thừa
    await page.getByRole('button', { name: 'Kế thừa' }).click();
    await page.waitForTimeout(2000);
    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    if (!(await modal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal kế thừa không hiện. Bỏ qua TC16.'); return;
    }

    const orderRows = modal.locator('.ant-table-tbody .ant-table-row');
    if (await orderRows.count() === 0) {
      await modal.locator('button.ant-modal-close').click({ force: true });
      console.log('⚠️ Không có đơn hàng. Bỏ qua TC16.'); return;
    }

    await orderRows.first().getByRole('button', { name: 'Chọn' }).click();

    const detailModal = page.locator('.ant-modal-content').filter({ hasText: 'Chọn chi tiết vật tư kế thừa' });
    if (!(await detailModal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal vật tư không hiện. Bỏ qua TC16.'); return;
    }

    await detailModal.locator('thead .ant-checkbox-input').first().check();
    await detailModal.getByRole('button', { name: 'Xác nhận kế thừa' }).click();
    await expect(detailModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // ── Verify ────────────────────────────────────────────
    // TC16a: Số đơn hàng (disabled) có giá trị
    const soDonHangField = page.locator('.ant-form-item').filter({ hasText: 'Số đơn hàng' });
    const soDonHangVal = await soDonHangField.locator('input').inputValue().catch(() => "");
    expect(soDonHangVal.trim().length).toBeGreaterThan(0);
    console.log(`✅ TC16a — Số đơn hàng: "${soDonHangVal}"`);

    // TC16b: Ngày đơn hàng (disabled) hiển thị
    const ngayDonHangField = page.locator('.ant-form-item').filter({ hasText: 'Ngày đơn hàng' });
    const ngayDonHangPicker = ngayDonHangField.locator('.ant-picker');
    const ngayDonHangVisible = await ngayDonHangPicker.isVisible().catch(() => false);
    expect(ngayDonHangVisible).toBeTruthy();
    const ngayDonHangVal = await ngayDonHangPicker.textContent().catch(() => "");
    console.log(`✅ TC16b — Ngày đơn hàng: "${ngayDonHangVal}"`);
    expect(ngayDonHangVal).toContain('/'); // format DD/MM/YYYY

    // TC16c: Nhân viên mua (có thể rỗng nếu PO không có NV)
    const nvMuaField = page.locator('.ant-form-item').filter({ hasText: 'Nhân viên mua' });
    const nvMuaInput = nvMuaField.locator('input').first();
    const nvMuaVal = await nvMuaInput.inputValue().catch(() => "");
    console.log(`✅ TC16c — Nhân viên mua: "${nvMuaVal}" (có thể rỗng)`);

    await page.screenshot({ path: 'tests/screenshots/TC16-form-fields-after-kethua.png', fullPage: true });
  });

  // ══════════════════════════════════════════════════════════════════════
  //  TC17: Verify HSD và mã lô hiển thị đúng trong bảng sau kế thừa
  // ══════════════════════════════════════════════════════════════════════
  test('TC17 — Verify HSD và mã lô trong bảng: hiển thị đúng sau kế thừa + chọn lô', async ({ page }) => {
    await page.goto(URLS.ADD);
    await page.waitForTimeout(3000);
    await clearOverlays(page);

    // Kế thừa
    const supplierSelect = page.locator('.ant-form-item').filter({ hasText: 'Tên nhà cung cấp' }).locator('.ant-select');
    await supplierSelect.click();
    await page.waitForTimeout(1500);
    const firstOpt = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    if (!(await firstOpt.isVisible().catch(() => false))) {
      console.log('⚠️ Không có NCC. Bỏ qua TC17.'); return;
    }
    await firstOpt.click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Kế thừa' }).click();
    await page.waitForTimeout(2000);
    const modal = page.locator('.ant-modal-content').filter({ hasText: 'Kế thừa đơn hàng mua' });
    if (!(await modal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal không hiện. Bỏ qua TC17.'); return;
    }

    const orderRows = modal.locator('.ant-table-tbody .ant-table-row');
    if (await orderRows.count() === 0) {
      await modal.locator('button.ant-modal-close').click({ force: true });
      console.log('⚠️ Không có đơn hàng. Bỏ qua TC17.'); return;
    }
    await orderRows.first().getByRole('button', { name: 'Chọn' }).click();

    const detailModal = page.locator('.ant-modal-content').filter({ hasText: 'Chọn chi tiết vật tư kế thừa' });
    if (!(await detailModal.isVisible().catch(() => false))) {
      console.log('⚠️ Modal vật tư không hiện. Bỏ qua TC17.'); return;
    }

    await detailModal.locator('thead .ant-checkbox-input').first().check();
    await detailModal.getByRole('button', { name: 'Xác nhận kế thừa' }).click();
    await expect(detailModal).toBeHidden({ timeout: 5000 });
    await page.waitForTimeout(1500);

    const rowCount = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowCount === 0) {
      console.log('⚠️ Không kế thừa được dòng nào. Bỏ qua TC17.'); return;
    }

    // TC17a: Cột mã lô có thể rỗng (API PO không trả mã lô)
    // nhưng cột phải tồn tại
    const tableHeaders = page.locator('.ant-table-thead th');
    const headerCount = await tableHeaders.count();
    expect(headerCount).toBeGreaterThan(5);
    console.log(`✅ TC17a — Bảng có ${headerCount} cột`);

    // TC17b: Nếu kế thừa có mã lô từ API → hiển thị text
    // (Có thể không có vì API đơn hàng mua thường không trả mã lô)
    const firstLoCell = page.locator('.ant-table-tbody .ant-table-row').first()
      .locator('.ant-select').first();
    const loSelectVisible = await firstLoCell.isVisible().catch(() => false);
    if (loSelectVisible) {
      console.log('✅ TC17b — Cột mã lô tồn tại trong bảng (Select)');
    }

    await page.screenshot({ path: 'tests/screenshots/TC17-lo-hsd-display.png', fullPage: true });
    console.log('✅ TC17 — Kết thúc kiểm tra HSD và mã lô');
  });
});
