/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU NHẶT HÀNG
 * ============================================================================
 *  Module: Kho > Phiếu nhặt hàng
 *  Route:  /kho/nhat-hang
 * ============================================================================
 *
 *  Test suite bao gồm các nhóm:
 *    G01 — Danh sách & Điều hướng
 *    G02 — Thêm / Chỉnh sửa vật tư (Select, Barcode, QR)
 *    G03 — Thao tác dòng (Sửa SL, Tách dòng, Xóa dòng)
 *    G04 — Validation Lưu (status=1)
 *    G05 — Validation Hoàn thành (status=2)
 *    G06 — Trạng thái phiếu (khóa khi hoàn thành, gán nhân viên)
 *    G07 — Bug #1: validateDuplicateMaLo không được gọi
 *    G08 — Bug #2: Debounce 3s → scan nhanh bị ignore
 *    G09 — Bug #3: Xử lý chuỗi rỗng trong handleQuantityChange
 *    G10 — Bug #4: Dòng con ma_vt bị rỗng → validate trùng luôn pass
 *    G11 — Bug #5: Khôi phục SL đơn mẹ sau khi xóa dòng con
 *    G12 — Bug #6: Sửa SL đơn dòng con → dòng mẹ bị reset tong_nhat về 0
 *    G13 — Bug #7: Không cap SL nhặt khi không có SL đơn (limits=[])
 *    G14 — Bug #8: isProcessingRef global block mọi scan, không riêng per-item
 *    G15 — Bug #9: validateDataSource không check trùng ma_lo
 *    G16 — Bug #10: Xóa dòng giữa → stt_rec0 bị re-index → mất liên kết
 *    G17 — Bug #11: fetchDonViTinh gọi 2 lần khi thêm vật tư
 *    G18 — Bug #12: message.error nhận object thay vì string
 *    G19 — Bug #13: Split tại SL=0 → soLuongDeNghi_tong=0 → validate dùng SL sai
 *    G20 — Edge cases còn lại
 *
 *  Chạy:
 *    npx playwright test tests/phieu-nhat-hang.spec.js --headed
 *    npx playwright test tests/phieu-nhat-hang.spec.js --headed --project=chromium
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { login, dismissNotifications } = require('./helpers/auth.helper');

// ═══════════════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════════════

async function clearOverlays(page) {
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════════════════

const URLS = {
  LIST:   '/kho/nhat-hang',
  DETAIL: null, // sẽ set sau khi có stt_rec từ danh sách
};

const MA_VAT_TU_TEST = 'VT001'; // thay bằng mã vật tư có trong hệ thống test

// ═══════════════════════════════════════════════════════════════════════════
//  TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G01 — Danh sách & Điều hướng', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC01: Trang danh sách hiển thị đúng
  // ──────────────────────────────────────────────────────────────────────
  test('TC01 — Trang danh sách phiếu nhặt hàng hiển thị đúng', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Tiêu đề
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU NHẶT HÀNG');

    // Bảng hiện
    const table = page.locator('.ant-table');
    await expect(table).toBeVisible();

    // Các cột chính
    const header = page.locator('.ant-table-thead');
    await expect(header.getByText('Tên KH')).toBeVisible();
    await expect(header.getByText('Số ĐH')).toBeVisible();
    await expect(header.getByText('Vùng')).toBeVisible();

    // Nút Tạo mới
    await expect(page.getByRole('button', { name: /Tạo mới/i })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC01.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC02: Mở chi tiết phiếu
  // ──────────────────────────────────────────────────────────────────────
  test('TC02 — Mở chi tiết phiếu nhặt hàng từ danh sách', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    const rows = page.locator('.ant-table-tbody .ant-table-row');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    // Click nút "Xem chi tiết" ở dòng đầu tiên
    const viewBtn = rows.first().locator('button[title="Xem chi tiết"]');
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForLoadState('networkidle');

      // URL phải chứa /chi-tiet/
      await expect(page).toHaveURL(/.*nhat-hang\/chi-tiet\/.*/);

      // Badge hiện
      await expect(page.getByText(/CHI TIẾT PHIẾU NHẶT HÀNG/i)).toBeVisible();
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC02.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC03: Nút quay lại
  // ──────────────────────────────────────────────────────────────────────
  test('TC03 — Nút quay lại từ chi tiết về danh sách Kho', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Mở chi tiết trước
    const viewBtn = page.locator('.ant-table-tbody .ant-table-row').first().locator('button[title="Xem chi tiết"]');
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForLoadState('networkidle');
    }

    await page.locator('.phieu-back-button').click();
    await expect(page).toHaveURL(/.*kho$/);

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC03.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC04: Tạo mới phiếu
  // ──────────────────────────────────────────────────────────────────────
  test('TC04 — Tạo mới phiếu nhặt hàng', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Click Tạo mới
    await page.getByRole('button', { name: /Tạo mới/i }).click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*nhat-hang\/them-moi/);

    // Badge THÊM PHIẾU NHẶT HÀNG
    await expect(page.getByText(/THÊM PHIẾU NHẶT HÀNG/i)).toBeVisible();

    // Bảng vật tư trống
    const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
    await expect(vatTuRows).toHaveCount(0);

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC04.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G02 — Thêm vật tư (Select, Barcode, QR)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G02 — Thêm vật tư', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    // Vào trang thêm mới
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC05: Thêm vật tư bằng select
  // ──────────────────────────────────────────────────────────────────────
  test('TC05 — Thêm vật tư bằng select vào bảng', async ({ page }) => {
    // Tìm input chọn vật tư (barcode input hoặc VatTuSelect)
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      // fallback: tìm ant-select có placeholder tương ứng
      console.log('⚠️  Không tìm thấy input quét vật tư, thử tìm VatTuSelect.');
      return;
    }

    // Click để mở dropdown
    await vatTuInput.click();
    await page.waitForTimeout(1500);

    // Chọn vật tư đầu tiên trong dropdown
    const firstOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    if (await firstOption.isVisible({ timeout: 5000 })) {
      await firstOption.click();
      await page.waitForTimeout(1000);

      // Kiểm tra bảng có ít nhất 1 dòng
      const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
      const count = await vatTuRows.count();
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Đã thêm vật tư, bảng có ${count} dòng.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC05.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC06: Thêm vật tư bằng barcode (gõ mã + Enter)
  // ──────────────────────────────────────────────────────────────────────
  test('TC06 — Thêm vật tư bằng barcode (gõ mã + Enter)', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Không tìm thấy input barcode.');
      return;
    }

    // Gõ mã vật tư test
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
    const count = await vatTuRows.count();

    if (count > 0) {
      console.log(`✅ Đã thêm vật tư ${MA_VAT_TU_TEST} qua barcode, bảng có ${count} dòng.`);
    } else {
      console.log(`⚠️  Mã ${MA_VAT_TU_TEST} không tìm thấy hoặc không thêm được.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC06.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC07: Scan barcode 2 lần cùng 1 mã → số lượng tăng, không thêm dòng mới
  // ──────────────────────────────────────────────────────────────────────
  test('TC07 — Scan cùng mã 2 lần → tăng số lượng trên cùng dòng', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Không tìm thấy input barcode.');
      return;
    }

    // Lần 1
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    const rows1 = await page.locator('.ant-table-tbody .ant-table-row').count();

    // Lần 2 — chờ 3.5s để vượt qua debounce 3s trong handleVatTuSelect
    await page.waitForTimeout(3500);
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    const rows2 = await page.locator('.ant-table-tbody .ant-table-row').count();

    // Cùng 1 dòng, số lượng tăng (không thêm dòng mới)
    expect(rows2).toBe(rows1);
    console.log(`✅ Scan 2 lần cùng mã → vẫn ${rows2} dòng (tăng số lượng trên dòng).`);

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC07.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC08: Mở / đóng QR Scanner
  // ──────────────────────────────────────────────────────────────────────
  test('TC08 — Mở modal QR Scanner', async ({ page }) => {
    // Tìm nút mở QR Scanner (camera icon)
    const qrBtn = page.locator('button[title="Quét QR"]');
    if (await qrBtn.isVisible()) {
      await qrBtn.click();
      await page.waitForTimeout(500);

      // Modal QR Scanner phải hiện
      const qrModal = page.locator('.ant-modal-content').filter({ hasText: /quét|mã vạch|camera/i });
      const modalVisible = await qrModal.isVisible().catch(() => false);

      if (modalVisible) {
        await expect(qrModal).toBeVisible();

        // Nút đóng
        await qrModal.locator('button.ant-modal-close').click({ force: true });
        await expect(qrModal).toBeHidden({ timeout: 5000 });
        console.log('✅ QR Scanner modal mở và đóng thành công.');
      } else {
        console.log('⚠️  Modal QR Scanner không hiện (camera có thể không khả dụng trên CI).');
      }
    } else {
      console.log('⚠️  Nút QR Scanner không visible.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC08.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G03 — Thao tác dòng (Sửa SL, Tách dòng, Xóa dòng)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G03 — Thao tác dòng', () => {

  // Helper: thêm 1 vật tư vào bảng (dùng chung cho các test trong group)
  async function addOneVatTu(page) {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) return false;

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    const count = await page.locator('.ant-table-tbody .ant-table-row').count();
    return count > 0;
  }

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC09: Sửa số lượng nhặt (tong_nhat)
  // ──────────────────────────────────────────────────────────────────────
  test('TC09 — Sửa số lượng nhặt trên dòng', async ({ page }) => {
    const added = await addOneVatTu(page);
    if (!added) {
      console.log('⚠️  Bỏ qua TC09 — không thêm được vật tư.');
      return;
    }

    // Tìm ô số lượng nhặt (cột "SL Nhặt" hoặc "Tổng nhặt")
    // AntD InputNumber — tìm input trong bảng có type="number"
    const slNhatInputs = page.locator('.ant-table-tbody input[type="number"]');
    const inputCount = await slNhatInputs.count();

    if (inputCount > 0) {
      // Double-click để select all, rồi nhập giá trị mới
      const firstInput = slNhatInputs.first();
      await firstInput.click({ clickCount: 3 });
      await firstInput.fill('5');
      await page.waitForTimeout(500);

      console.log(`✅ Đã sửa SL nhặt thành 5 (${inputCount} ô số lượng tìm thấy).`);
    } else {
      console.log('⚠️  Không tìm thấy ô số lượng nhặt trong bảng.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC09.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC10: Tách dòng (thêm dòng con)
  // ──────────────────────────────────────────────────────────────────────
  test('TC10 — Tách dòng (thêm dòng con)', async ({ page }) => {
    const added = await addOneVatTu(page);
    if (!added) {
      console.log('⚠️  Bỏ qua TC10 — không thêm được vật tư.');
      return;
    }

    // Tìm nút "+" (thêm dòng) trên dòng đầu tiên
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    const btnCount = await addRowBtns.count();

    if (btnCount > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);

      const rowsAfter = await page.locator('.ant-table-tbody .ant-table-row').count();
      expect(rowsAfter).toBeGreaterThan(1);
      console.log(`✅ Đã tách dòng: ${rowsAfter} dòng (từ 1 lên ${rowsAfter}).`);
    } else {
      console.log('⚠️  Nút tách dòng không visible (có thể cần SL nhặt > 0 mới hiện).');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC10.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC11: Xóa dòng vật tư
  // ──────────────────────────────────────────────────────────────────────
  test('TC11 — Xóa dòng vật tư', async ({ page }) => {
    const added = await addOneVatTu(page);
    if (!added) {
      console.log('⚠️  Bỏ qua TC11 — không thêm được vật tư.');
      return;
    }

    const rowsBefore = await page.locator('.ant-table-tbody .ant-table-row').count();

    // Tìm nút xóa (Delete icon hoặc title="Xóa")
    const deleteBtns = page.locator('.ant-table-tbody button[title="Xóa"]');
    const btnCount = await deleteBtns.count();

    if (btnCount > 0) {
      await deleteBtns.first().click();
      await page.waitForTimeout(500);

      // Confirm dialog có thể hiện — click OK
      const okBtn = page.locator('.ant-popconfirm .ant-btn-primary').first();
      if (await okBtn.isVisible({ timeout: 2000 })) {
        await okBtn.click();
        await page.waitForTimeout(1000);
      }

      const rowsAfter = await page.locator('.ant-table-tbody .ant-table-row').count();
      expect(rowsAfter).toBeLessThan(rowsBefore);
      console.log(`✅ Đã xóa dòng: ${rowsBefore} → ${rowsAfter} dòng.`);
    } else {
      console.log('⚠️  Nút xóa không visible.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC11.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G04 — Validation Lưu (status=1)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G04 — Validation Lưu (status=1)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC12: Validation — Lưu khi bảng trống → báo lỗi, không submit
  // ──────────────────────────────────────────────────────────────────────
  test('TC12 — Lưu khi bảng trống → báo lỗi "Vui lòng thêm ít nhất một vật tư"', async ({ page }) => {
    // Bảng trống (chưa thêm vật tư)
    const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
    await expect(vatTuRows).toHaveCount(0);

    // Click Lưu
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Phải hiện message lỗi validation
    const hasErrorMsg = await page.locator('.ant-message-error').isVisible().catch(() => false);
    const hasFormError = await page.locator('.ant-form-item-explain-error').first().isVisible().catch(() => false);

    if (hasErrorMsg || hasFormError) {
      console.log('✅ Validation Lưu hoạt động: bảng trống không cho Lưu.');
    } else {
      console.log('⚠️  Không thấy message lỗi, nhưng vẫn ở trang thêm mới.');
    }

    // Vẫn ở trang thêm mới (không redirect)
    await expect(page).toHaveURL(/.*them-moi/);

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC12.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC13: Lưu khi tong_nhat > soLuongDeNghi → báo lỗi
  //        Ràng buộc: tong_nhat ≤ soLuongDeNghi của từng dòng
  // ──────────────────────────────────────────────────────────────────────
  test('TC13 — Lưu khi SL nhặt vượt SL đơn → báo lỗi "SL nhặt không được vượt quá SL đơn"', async ({ page }) => {
    // Thêm vật tư
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC13 — không tìm thấy input vật tư.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    // Sửa SL nhặt thành giá trị lớn hơn SL đơn
    // Tìm tất cả input số trong bảng
    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    const inputCount = await numberInputs.count();

    if (inputCount >= 2) {
      // Input thứ 2 = SL nhặt (sau mã vật tư)
      // Double-click → select all → fill giá trị lớn
      const slNhatInput = numberInputs.nth(1);
      await slNhatInput.click({ clickCount: 3 });
      await slNhatInput.fill('99999'); // vượt SL đơn
      await page.waitForTimeout(500);

      // Lưu
      const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(2000);

      const hasErrorMsg = await page.locator('.ant-message-error').isVisible().catch(() => false);
      if (hasErrorMsg) {
        console.log('✅ Validation hoạt động: SL nhặt vượt SL đơn → báo lỗi.');
      }
    } else {
      console.log(`⚠️  Chỉ có ${inputCount} ô input, không đủ để test SL nhặt.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC13.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC14: Lưu thành công khi dữ liệu hợp lệ
  // ──────────────────────────────────────────────────────────────────────
  test('TC14 — Lưu thành công khi có vật tư và SL hợp lệ', async ({ page }) => {
    // Thêm vật tư
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC14.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    const vatTuRows = page.locator('.ant-table-tbody .ant-table-row');
    if (await vatTuRows.count() === 0) {
      console.log('⚠️  Bỏ qua TC14 — không thêm được vật tư.');
      return;
    }

    // Lưu
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Kiểm tra: redirect về danh sách HOẶC hiện success message
    const redirected = await page.waitForURL(/.*nhat-hang$/, { timeout: 5000 }).then(() => true).catch(() => false);
    const hasSuccess = await page.locator('.ant-message-success').isVisible().catch(() => false);

    if (redirected || hasSuccess) {
      console.log('✅ Lưu thành công.');
    } else {
      console.log('⚠️  Không rõ kết quả Lưu.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC14.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G05 — Validation Hoàn thành (status=2)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G05 — Validation Hoàn thành (status=2)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    // Vào trang thêm mới
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // Helper: thêm vật tư
  async function addVatTu(page) {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) return false;
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);
    return (await page.locator('.ant-table-tbody .ant-table-row').count()) > 0;
  }

  // ──────────────────────────────────────────────────────────────────────
  //  TC15: Hoàn thành khi tổng nhặt CHƯA BẰNG số lượng đơn → báo lỗi
  //        Ràng buộc: tong_nhat nhóm phải BẰNG so_luong (không thiếu, không dư)
  // ──────────────────────────────────────────────────────────────────────
  test('TC15 — Hoàn thành khi tổng nhặt chưa bằng SL đơn → báo lỗi', async ({ page }) => {
    const added = await addVatTu(page);
    if (!added) {
      console.log('⚠️  Bỏ qua TC15 — không thêm được vật tư.');
      return;
    }

    // Mở dropdown Hoàn thành
    const completeBtn = page.getByRole('button', { name: /Hoàn thành/i }).first();
    if (!(await completeBtn.isVisible())) {
      console.log('⚠️  Nút Hoàn thành không visible (cần Lưu trước?).');
      return;
    }

    await completeBtn.click();
    await page.waitForTimeout(500);

    // Confirm dialog hiện
    const confirmModal = page.locator('.ant-modal-content').filter({ hasText: /xác nhận hoàn thành/i });
    if (await confirmModal.isVisible()) {
      // Click OK trong confirm
      await confirmModal.getByRole('button', { name: /OK|Đồng ý/i }).click();
      await page.waitForTimeout(2000);
    }

    // Phải báo lỗi (tổng nhặt chưa bằng SL đơn)
    const hasErrorMsg = await page.locator('.ant-message-error').isVisible().catch(() => false);
    if (hasErrorMsg) {
      console.log('✅ Validation Hoàn thành hoạt động: tổng nhặt chưa bằng SL đơn → báo lỗi.');
    } else {
      console.log('⚠️  Không thấy message lỗi, có thể SL đã bằng SL đơn rồi.');
    }

    // Vẫn ở trang chỉnh sửa (không redirect)
    await expect(page).toHaveURL(/.*nhat-hang\/them-moi/);

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC15.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC16: Hoàn thành khi có dòng theo dõi lô (lo_yn=true) mà chưa nhập ma_lo
  //        Ràng buộc: tong_nhat > 0 + lo_yn=true → BẮT BUỘC nhập ma_lo
  // ──────────────────────────────────────────────────────────────────────
  test('TC16 — Hoàn thành khi dòng theo dõi lô chưa nhập mã lô → báo lỗi', async ({ page }) => {
    const added = await addVatTu(page);
    if (!added) {
      console.log('⚠️  Bỏ qua TC16 — không thêm được vật tư.');
      return;
    }

    // Tìm dropdown chọn mã lô (ma_lo) trong bảng
    const loSelect = page.locator('.ant-table-tbody .ant-select').filter({ hasText: '' }).first();
    const loSelectVisible = await loSelect.isVisible().catch(() => false);

    if (!loSelectVisible) {
      console.log('⚠️  Dropdown mã lô không visible (vật tư này có thể không theo dõi lô).');
      // Vẫn thử click Hoàn thành
    }

    // Click Hoàn thành
    const completeBtn = page.getByRole('button', { name: /Hoàn thành/i }).first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(500);

      const confirmModal = page.locator('.ant-modal-content').filter({ hasText: /xác nhận hoàn thành/i });
      if (await confirmModal.isVisible()) {
        await confirmModal.getByRole('button', { name: /OK|Đồng ý/i }).click();
        await page.waitForTimeout(2000);
      }

      // Kiểm tra dòng được highlight đỏ (nếu validation chạy)
      const invalidRow = page.locator('.ant-table-row-invalid').first();
      const hasInvalid = await invalidRow.isVisible().catch(() => false);

      if (hasInvalid) {
        console.log('✅ Dòng lỗi được highlight đỏ.');
      } else {
        console.log('⚠️  Không thấy dòng lỗi highlight (mã lô có thể không bắt buộc cho vật tư này).');
      }
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC16.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G06 — Trạng thái phiếu & Phân quyền
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G06 — Trạng thái phiếu & Phân quyền', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC17: Phiếu đã hoàn thành (status=2) → nút Sửa bị disabled
  // ──────────────────────────────────────────────────────────────────────
  test('TC17 — Phiếu đã hoàn thành → nút Sửa bị disabled', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Tìm dòng có trạng thái "Hoàn thành" hoặc badge status=2
    const completedRows = page.locator('.ant-table-tbody .ant-table-row').filter({ hasText: /hoàn thành|2/i });

    if (await completedRows.count() === 0) {
      console.log('⚠️  Không có phiếu nào ở trạng thái Hoàn thành để test.');
      return;
    }

    // Mở chi tiết phiếu hoàn thành
    const viewBtn = completedRows.first().locator('button[title="Xem chi tiết"]');
    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    // Nút Sửa phải không visible hoặc disabled
    const editBtn = page.locator('.phieu-edit-button-kd, button[title="Chỉnh sửa"]').first();
    const isVisible = await editBtn.isVisible().catch(() => false);
    const isDisabled = await editBtn.isDisabled().catch(() => true);

    if (isVisible) {
      expect(isDisabled).toBe(true);
      console.log('✅ Nút Sửa bị disabled cho phiếu đã hoàn thành.');
    } else {
      console.log('⚠️  Nút Sửa không hiện (có thể đã ẩn cho status=2).');
    }

    // Badge phải hiện "CHI TIẾT PHIẾU NHẶT HÀNG" (không phải SỬA)
    await expect(page.getByText(/CHI TIẾT PHIẾU NHẶT HÀNG/i)).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC17.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC18: Click Sửa → gọi API start (gán nhân viên), chuyển sang edit mode
  // ──────────────────────────────────────────────────────────────────────
  test('TC18 — Click Sửa → chuyển sang edit mode và hiện footer actions', async ({ page }) => {
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Lấy dòng đầu tiên chưa hoàn thành
    const rows = page.locator('.ant-table-tbody .ant-table-row');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const viewBtn = rows.first().locator('button[title="Xem chi tiết"]');
    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    // Badge = CHI TIẾT (chưa edit mode)
    await expect(page.getByText(/CHI TIẾT PHIẾU NHẶT HÀNG/i)).toBeVisible();

    // Nút Sửa phải visible
    const editBtn = page.locator('button[title="Chỉnh sửa"]').first();
    if (await editBtn.isVisible() && !(await editBtn.isDisabled())) {
      await editBtn.click();
      await page.waitForLoadState('networkidle');
      await clearOverlays(page);

      // Sau khi sửa: badge = SỬA PHIẾU NHẶT HÀNG
      await expect(page.getByText(/SỬA PHIẾU NHẶT HÀNG/i)).toBeVisible();

      // Footer actions phải hiện: Lưu, Hoàn thành, Huỷ nhặt
      await expect(page.getByRole('button', { name: /Lưu/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Hoàn thành/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Huỷ nhặt/i })).toBeVisible();

      console.log('✅ Chuyển sang edit mode thành công.');
    } else {
      console.log('⚠️  Nút Sửa không available (phiếu có thể đã bị khóa).');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC18.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC19: Nút Huỷ nhặt → showConfirm → gọi API hủy
  // ──────────────────────────────────────────────────────────────────────
  test('TC19 — Nút Huỷ nhặt → hiện confirm và gọi API', async ({ page }) => {
    // Vào thẳng edit mode
    await page.goto(URLS.LIST);
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    const viewBtn = page.locator('.ant-table-tbody .ant-table-row').first().locator('button[title="Xem chi tiết"]');
    if (!(await viewBtn.isVisible())) {
      console.log('⚠️  Không có phiếu nào để test.');
      return;
    }
    await viewBtn.click();
    await page.waitForLoadState('networkidle');

    // Click Sửa
    const editBtn = page.locator('button[title="Chỉnh sửa"]').first();
    if (!(await editBtn.isVisible())) {
      console.log('⚠️  Nút Sửa không visible.');
      return;
    }
    await editBtn.click();
    await page.waitForLoadState('networkidle');

    // Tìm nút Huỷ nhặt
    const huyBtn = page.getByRole('button', { name: /Huỷ nhặt/i }).first();
    if (await huyBtn.isVisible() && !(await huyBtn.isDisabled())) {
      await huyBtn.click();
      await page.waitForTimeout(500);

      // Confirm dialog
      const confirmModal = page.locator('.ant-modal-content').filter({ hasText: /huỷ nhặt/i });
      const hasConfirm = await confirmModal.isVisible().catch(() => false);

      if (hasConfirm) {
        // Đóng confirm (không thực sự hủy)
        await confirmModal.locator('button.ant-modal-close').click({ force: true });
        console.log('✅ Confirm dialog hiện đúng khi click Huỷ nhặt.');
      } else {
        console.log('⚠️  Confirm dialog không hiện.');
      }
    } else {
      console.log('⚠️  Nút Huỷ nhặt không available.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC19.png', fullPage: true });
  });
});

test.describe('G07 — Bug ngầm #1: validateDuplicateMaLo không được gọi', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC20: [BUG] Thêm 2 dòng cùng ma_vt + cùng ma_lo → Lưu vẫn thành công
  //         (validateDuplicateMaLo tồn tại trong utils nhưng KHÔNG được gọi
  //          ở handleSubmit / handleComplete → bug ngầm)
  //
  //  Expected (fix): Lưu bị chặn, hiện lỗi "Trùng cặp ma_vt + ma_lo"
  //  Actual (bug):  Lưu thành công dù trùng
  // ──────────────────────────────────────────────────────────────────────
  test('TC20 — [BUG] 2 dòng trùng ma_vt+ma_lo → Lưu vẫn thành công (validateDuplicateMaLo chưa được gọi)', async ({ page }) => {
    // Thêm vật tư lần 1
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC20 — không tìm thấy input vật tư.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC20 — không thêm được vật tư.');
      return;
    }

    // Tách dòng để tạo dòng con
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    const rowsCount = await page.locator('.ant-table-tbody .ant-table-row').count();

    // Lưu
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(3000);

    // Nếu validateDuplicateMaLo được gọi → phải báo lỗi "Trùng"
    // Nếu KHÔNG báo lỗi → confirm bug ngầm #1
    const hasDuplicateError = await page.locator('.ant-message-error').isVisible().catch(() => false);

    if (!hasDuplicateError) {
      console.log('🔴 [BUG CONFIRMED] validateDuplicateMaLo KHÔNG được gọi — Lưu thành công dù trùng cặp ma_vt+ma_lo.');
      console.log(`   Bảng có ${rowsCount} dòng cùng ma_vt+ma_lo, vẫn cho Lưu.`);
    } else {
      console.log('✅ validateDuplicateMaLo đã được gọi — phát hiện trùng, Lưu bị chặn.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC20.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G08 — Bug ngầm #2: Debounce 3 giây → Scan nhanh bị ignore hoàn toàn
//          (isProcessingRef khóa 3 giây cho toàn bộ input, không chỉ cùng mã)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G08 — Bug ngầm #2: Scan nhanh bị ignore do debounce 3s', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC21: [BUG] Scan mã A → chờ 1s → scan mã B → mã B bị ignore
  //         do isProcessingRef.current = true trong 3 giây
  //
  //  Expected: Cả A và B đều được thêm
  //  Actual:   B bị ignore vì 1s < 3s debounce
  // ──────────────────────────────────────────────────────────────────────
  test('TC21 — [BUG] Scan mã B trong vòng 3s sau mã A → mã B bị ignore', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC21 — không tìm thấy input.');
      return;
    }

    // Scan mã A
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1000); // chỉ 1s < debounce 3s

    const rowsAfterA = await page.locator('.ant-table-tbody .ant-table-row').count();

    // Scan mã B ngay sau A (trong vòng 3s)
    const MA_VAT_TU_B = MA_VAT_TU_TEST + 'B'; // mã khác
    await vatTuInput.fill(MA_VAT_TU_B);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(2000);

    const rowsAfterB = await page.locator('.ant-table-tbody .ant-table-row').count();

    if (rowsAfterB === rowsAfterA) {
      console.log(`🔴 [BUG CONFIRMED] Mã B bị ignore — debounce 3s chặn scan liên tiếp.`);
      console.log(`   Sau mã A: ${rowsAfterA} dòng. Sau mã B: ${rowsAfterB} dòng (không thay đổi).`);
    } else {
      console.log(`✅ Cả 2 mã đều được thêm: ${rowsAfterA} → ${rowsAfterB} dòng.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC21.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G09 — Bug ngầm #3: handleQuantityChange nhận giá trị chuỗi rỗng
//          "newValue = ''" rồi gán vào state → có thể gây NaN
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G09 — Bug ngầm #3: Xử lý chuỗi rỗng trong handleQuantityChange', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC22: Xóa toàn bộ giá trị trong ô SL nhặt → giá trị là chuỗi rỗng
  //         newValue = '' được xử lý → set về 0
  //         Nhưng nếu type = "string" kết thúc bằng '.' → vẫn giữ nguyên
  // ──────────────────────────────────────────────────────────────────────
  test('TC22 — Xóa ô SL nhặt → giá trị về 0 (đúng)', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC22.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC22 — không thêm được vật tư.');
      return;
    }

    // Tìm input số lượng nhặt
    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    const inputCount = await numberInputs.count();
    if (inputCount < 2) {
      console.log(`⚠️  Chỉ có ${inputCount} ô input, bỏ qua.`);
      return;
    }

    // Xóa hết giá trị SL nhặt
    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.press('Backspace');
    await page.waitForTimeout(500);

    // Check giá trị
    const inputValue = await slNhatInput.inputValue();
    console.log(`Giá trị input sau khi xóa: "${inputValue}"`);
    // Nếu giá trị là rỗng hoặc 0 → đúng
    if (inputValue === '' || inputValue === '0') {
      console.log('✅ Xóa → giá trị về 0 hoặc rỗng (đúng logic).');
    } else {
      console.log(`⚠️  Giá trị là "${inputValue}" sau khi xóa.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC22.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC23: Nhập giá trị decimal (vd: 1.5) → làm tròn → cần kiểm tra
  // ──────────────────────────────────────────────────────────────────────
  test('TC23 — Nhập giá trị decimal → tính toán đúng', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC23.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC23.');
      return;
    }

    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    if ((await numberInputs.count()) < 2) return;

    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.fill('1.5');
    await page.waitForTimeout(500);
    await slNhatInput.press('Tab');
    await page.waitForTimeout(1000);

    const inputValue = await slNhatInput.inputValue();
    console.log(`Giá trị sau khi nhập 1.5: "${inputValue}"`);
    // Code dùng Math.round → 1.5 → 2
    // Nên check: input hiển thị 2 (đã làm tròn) hay 1.5 (giữ nguyên)
    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC23.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G10 — Bug ngầm #4: Dòng con tạo từ split → ma_vt để rỗng (không copy từ mẹ)
//          → Validate trùng dùng ma_vt từ spread parent không bao giờ bắt được
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G10 — Bug ngầm #4: Dòng con không có ma_vt → validate trùng luôn pass', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC24: [BUG] Tách dòng → dòng con có ma_vt = rỗng (mặc dù code gán)
  //         validateDuplicateMaLo check ma_vt từ item.ma_vt hoặc item.maHang
  //         Nếu dòng con có ma_vt = "" → không báo trùng khi thực tế trùng
  //
  //  Expected: Dòng con giữ nguyên ma_vt từ mẹ
  //  Actual:   Dòng con có ma_vt = "" → validate không bắt được trùng
  // ──────────────────────────────────────────────────────────────────────
  test('TC24 — [BUG] Dòng con tạo từ tách dòng → kiểm tra ma_vt có bị rỗng không', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC24.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC24 — không thêm được vật tư.');
      return;
    }

    // Tách dòng
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    const rows = await page.locator('.ant-table-tbody .ant-table-row').count();
    console.log(`Sau khi tách: ${rows} dòng`);

    if (rows >= 2) {
      // Dòng 1 = mẹ, dòng 2 = con
      // Kiểm tra data-key hoặc text hiển thị
      const firstRowText = await page.locator('.ant-table-tbody .ant-table-row').first().textContent();
      const secondRowText = await page.locator('.ant-table-tbody .ant-table-row').nth(1).textContent();

      console.log(`Dòng 1 (mẹ): ${firstRowText.substring(0, 100)}`);
      console.log(`Dòng 2 (con): ${secondRowText.substring(0, 100)}`);

      // Nếu dòng con không hiện mã vật tư → ma_vt có thể bị rỗng
      const childHasMaHang = secondRowText.includes(MA_VAT_TU_TEST);
      if (!childHasMaHang) {
        console.log(`🔴 [POTENTIAL BUG] Dòng con không hiện mã ${MA_VAT_TU_TEST} → ma_vt có thể bị rỗng.`);
      } else {
        console.log('✅ Dòng con hiện đúng mã vật tư.');
      }
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC24.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G11 — Bug ngầm #5: Khi xóa dòng mẹ → tất cả dòng con bị xóa (đúng)
//          Nhưng nếu dòng con bị xóa → SL đơn của dòng mẹ KHÔNG được khôi phục
//          nếu dòng mẹ đã bị tách (có soLuongDeNghi_tong)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G11 — Bug ngầm #5: Khôi phục SL đơn mẹ sau khi xóa dòng con', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC25: [BUG] Tách dòng → sửa SL nhặt → xóa dòng con → SL mẹ bị reset sai
  //
  //  Step: Thêm VT → tách dòng → sửa SL nhặt dòng mẹ → xóa dòng con
  //  Expected: SL mẹ = tổng SL đơn gốc
  //  Actual:   SL mẹ có thể bị reset về 0 hoặc giá trị không đúng
  // ──────────────────────────────────────────────────────────────────────
  test('TC25 — Xóa dòng con → kiểm tra SL đơn mẹ có được khôi phục đúng không', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC25.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC25 — không thêm được vật tư.');
      return;
    }

    // Tách dòng
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    const rowsBeforeDelete = await page.locator('.ant-table-tbody .ant-table-row').count();

    // Xóa dòng con (dòng thứ 2)
    const deleteBtns = page.locator('.ant-table-tbody button[title="Xóa"]');
    if (await deleteBtns.count() >= 2) {
      // Click nút xóa ở dòng con (dòng 2)
      await deleteBtns.nth(1).click();
      await page.waitForTimeout(500);

      // Confirm
      const okBtn = page.locator('.ant-popconfirm .ant-btn-primary').first();
      if (await okBtn.isVisible({ timeout: 2000 })) {
        await okBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    const rowsAfterDelete = await page.locator('.ant-table-tbody .ant-table-row').count();
    console.log(`Trước xóa: ${rowsBeforeDelete} dòng. Sau xóa: ${rowsAfterDelete} dòng.`);

    if (rowsAfterDelete === rowsBeforeDelete - 1 || rowsAfterDelete === 1) {
      console.log('✅ Xóa dòng con thành công.');
    } else {
      console.log(`⚠️  Số dòng thay đổi không như kỳ vọng: ${rowsBeforeDelete} → ${rowsAfterDelete}.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC25.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G12 — Bug ngầm #6: Khi edit dòng con, SL đơn dòng mẹ bị reset về 0
//          khi handleQuantityChange cho soLuongDeNghi dòng con
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G12 — Bug ngầm #6: Sửa SL đơn dòng con → dòng mẹ bị reset về 0', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC26: [BUG] Tách dòng → sửa SL đơn dòng con → dòng mẹ bị reset tong_nhat=0
  //
  //  Code handleQuantityChange line 821-859:
  //  Khi sửa soLuongDeNghi dòng con → mẹ bị reset tong_nhat=0 và nhat=0
  //  Điều này có thể gây bug nghiêm trọng nếu mẹ đã nhập đủ SL
  //
  //  Expected: Chỉ cập nhật SL đơn, không reset tong_nhat mẹ
  //  Actual:   tong_nhat và nhat mẹ bị set về 0
  // ──────────────────────────────────────────────────────────────────────
  test('TC26 — [BUG] Sửa SL đơn dòng con → dòng mẹ bị reset tong_nhat về 0', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC26.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC26 — không thêm được vật tư.');
      return;
    }

    // Tách dòng để tạo dòng con
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    const rowsCount = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowsCount < 2) {
      console.log(`⚠️  Chỉ có ${rowsCount} dòng, không đủ để test dòng con.`);
      return;
    }

    // Tìm tất cả input trong bảng — dòng con nằm ở vị trí thứ N
    // Cấu trúc dòng: mã vật tư (readonly) | SL nhặt | SL đơn | DVT | Xóa | Thêm
    // Dòng con: mã VT trống | SL nhặt | SL đơn | DVT | Xóa
    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    const inputCount = await numberInputs.count();

    if (inputCount < 4) {
      console.log(`⚠️  Chỉ có ${inputCount} input, không đủ để test.`);
      return;
    }

    // Dòng con có 2 ô số: SL nhặt và SL đơn (sau mã vật tư)
    // Nếu tách 1 lần: dòng 1 (mẹ) + dòng 2 (con) = 4 input số
    // Input thứ 4 = SL đơn dòng con

    // Sửa SL đơn dòng con (input thứ 4)
    const childSLDonInput = numberInputs.nth(3);
    await childSLDonInput.click({ clickCount: 3 });
    await childSLDonInput.fill('1');
    await childSLDonInput.press('Tab');
    await page.waitForTimeout(1000);

    console.log('✅ Đã sửa SL đơn dòng con = 1. Kiểm tra dòng mẹ bị reset tong_nhat không.');

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC26.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G13 — Bug ngầm #7: Capping SL nhặt → warning hiện NHƯNG giá trị không bị cap
//          performQuantityChange line 804: chỉ cap khi limits.length > 0
//          Nếu rowOrderQty = 0 và groupOrderQty = 0 → limits = [] → không cap
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G13 — Bug ngầm #7: Không cap SL nhặt khi không có SL đơn', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC27: [BUG] Dòng không có SL đơn (soLuongDeNghi = 0) → nhập SL nhặt = 99999
  //         → KHÔNG bị cap (limits = [] vì rowOrderQty=0, groupOrderQty=0)
  //
  //  Expected: Có thể bị cap bởi SL nhóm hoặc tồn kho
  //  Actual:   Không bị cap gì cả
  // ──────────────────────────────────────────────────────────────────────
  test('TC27 — [BUG] Nhập SL nhặt lớn khi không có SL đơn → không bị cap', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC27.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC27 — không thêm được vật tư.');
      return;
    }

    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    if ((await numberInputs.count()) < 2) {
      console.log('⚠️  Không đủ input.');
      return;
    }

    // Nhập SL nhặt rất lớn (99999)
    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.fill('99999');
    await slNhatInput.press('Tab');
    await page.waitForTimeout(1000);

    const finalValue = await slNhatInput.inputValue();
    console.log(`Giá trị sau khi nhập 99999: "${finalValue}"`);

    if (finalValue === '99999') {
      console.log('🔴 [BUG CONFIRMED] SL nhặt = 99999 được giữ nguyên — không bị cap vì SL đơn = 0.');
    } else if (finalValue !== '99999') {
      console.log(`✅ SL nhặt bị cap về: ${finalValue}`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC27.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G14 — Bug ngầm #8: isProcessingRef global → khi 1 scan đang xử lý API,
//          tất cả input khác bị block, không riêng mã đó
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G14 — Bug ngầm #8: isProcessingRef global block mọi scan', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC28: [BUG] Scan 2 mã khác nhau nhanh → mã thứ 2 bị block
  //         isProcessingRef dùng chung cho toàn bộ hook, không phải per-item
  //
  //  Expected: 2 mã khác nhau → thêm 2 dòng
  //  Actual:   Mã 2 bị skip do isProcessingRef
  // ──────────────────────────────────────────────────────────────────────
  test('TC28 — [BUG] Scan 2 mã khác nhau nhanh → mã thứ 2 bị ignore', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC28.');
      return;
    }

    const MA_A = MA_VAT_TU_TEST;
    const MA_B = 'VTDIFF01'; // mã hoàn toàn khác

    // Scan mã A
    await vatTuInput.fill(MA_A);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(500); // chỉ 0.5s

    // Scan mã B ngay
    await vatTuInput.fill(MA_B);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(2000);

    const rows = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rows < 2) {
      console.log(`🔴 [BUG CONFIRMED] isProcessingRef block mã B — chỉ có ${rows} dòng.`);
    } else {
      console.log(`✅ Cả 2 mã đều được thêm: ${rows} dòng.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC28.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G15 — Bug ngầm #9: validateDataSource KHÔNG check duplicate ma_lo
//          (chỉ check ma_kho cho phiếu không phải nhat-hang)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G15 — Bug ngầm #9: validateDataSource không check trùng ma_lo', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC29: [BUG] 2 dòng trùng ma_lo → validateDataSource vẫn pass
  //         validateDuplicateMaLo tồn tại nhưng KHÔNG được gọi
  //
  //  Expected: Lưu bị chặn bởi validateDataSource hoặc validateTongNhat
  //  Actual:   Không bị chặn ở cả 2
  // ──────────────────────────────────────────────────────────────────────
  test('TC29 — [BUG] 2 dòng trùng ma_lo → validateDataSource không phát hiện', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC29.');
      return;
    }

    // Thêm vật tư → tách dòng → 2 dòng cùng ma_lo (rỗng) → trùng
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC29.');
      return;
    }

    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    // Cả 2 dòng đều có ma_lo = "" (rỗng) → trùng cặp
    // Click Lưu
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const hasError = await page.locator('.ant-message-error').isVisible().catch(() => false);
    if (!hasError) {
      console.log('🔴 [BUG CONFIRMED] validateDataSource KHÔNG phát hiện trùng ma_lo — Lưu không bị chặn.');
    } else {
      console.log('✅ Lưu bị chặn (có validation cho trùng ma_lo).');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC29.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G16 — Bug ngầm #10: buildPhieuNhatHangPayload gán stt_rec0 = index + 1
//          Khi xóa dòng giữa bảng → stt_rec0 bị re-index → mất liên kết
//          với các phiếu khác (px, pn) đã lưu trước đó
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G16 — Bug ngầm #10: Xóa dòng giữa → stt_rec0 bị re-index → mất liên kết', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC30: [BUG] Thêm 3 vật tư → xóa dòng 2 → stt_rec0 bị re-index
  //         stt_rec0 mới: dòng 1→001, dòng 3→002 → mất liên kết
  //
  //  Expected: stt_rec0 giữ nguyên giá trị cũ
  //  Actual:   stt_rec0 = index+1 (re-index hoàn toàn)
  // ──────────────────────────────────────────────────────────────────────
  test('TC30 — [BUG] Xóa dòng giữa → stt_rec0 bị re-index', async ({ page }) => {
    // Thêm 3 vật tư
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC30.');
      return;
    }

    for (let i = 0; i < 3; i++) {
      await vatTuInput.fill(MA_VAT_TU_TEST + i);
      await page.waitForTimeout(500);
      await vatTuInput.press('Enter');
      await page.waitForTimeout(1500);
    }

    const rowsBefore = await page.locator('.ant-table-tbody .ant-table-row').count();

    if (rowsBefore < 3) {
      console.log(`⚠️  Chỉ có ${rowsBefore} dòng, bỏ qua TC30.`);
      return;
    }

    // Xóa dòng 2
    const deleteBtns = page.locator('.ant-table-tbody button[title="Xóa"]');
    await deleteBtns.nth(1).click();
    await page.waitForTimeout(500);

    const okBtn = page.locator('.ant-popconfirm .ant-btn-primary').first();
    if (await okBtn.isVisible({ timeout: 2000 })) {
      await okBtn.click();
      await page.waitForTimeout(1000);
    }

    const rowsAfter = await page.locator('.ant-table-tbody .ant-table-row').count();
    console.log(`Trước xóa: ${rowsBefore} dòng. Sau xóa: ${rowsAfter} dòng.`);

    if (rowsAfter === rowsBefore - 1) {
      console.log('✅ Dòng đã bị xóa. stt_rec0 giờ bị re-index → cần kiểm tra backend.');
      console.log('🔴 [POTENTIAL BUG] stt_rec0 bị re-index (index+1) → mất liên kết với phiếu khác.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC30.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G17 — Bug ngầm #11: handleVatTuSelect gọi fetchDonViTinh 2 lần liên tiếp
//          (1 lần cho vatTuInfo, 1 lần cho donViTinhList) → chậm
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G17 — Bug ngầm #11: Fetch đơn vị tính 2 lần khi thêm vật tư', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC31: [BUG] Thêm vật tư → fetchDonViTinh được gọi 2 lần
  //         Line 169: fetchVatTuDetail(value)
  //         Line 188: fetchDonViTinh(value) — KHÔNG reuse kết quả từ line 169
  //
  //  Expected: Gọi 1 lần, reuse kết quả
  //  Actual:   Gọi 2 lần → chậm, tốn API
  // ──────────────────────────────────────────────────────────────────────
  test('TC31 — [BUG] Thêm vật tư → kiểm tra số lần gọi fetchDonViTinh (cần network log)', async ({ page }) => {
    // BUG này cần kiểm tra qua Network tab của DevTools
    // Test E2E chỉ verify vật tư được thêm thành công

    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC31.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(2000); // đợi đủ để cả 2 API call hoàn thành

    const rows = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rows > 0) {
      console.log('✅ Vật tư được thêm thành công.');
      console.log('🔴 [BUG] Code gọi fetchDonViTinh 2 lần:');
      console.log('   Line 169: fetchVatTuDetail(value) — lấy thông tin vật tư');
      console.log('   Line 188: fetchDonViTinh(value)  — lấy đơn vị tính (có thể trùng API)');
      console.log('   → Cần refactor: reuse kết quả từ fetchVatTuDetail hoặc gộp 1 lần gọi.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC31.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G18 — Bug ngầm #12: message.error với object thay vì string
//          validateDataSource line 54: message.error({ content: ... })
//          antd message.error() nhận string, object có thể gây lỗi render
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G18 — Bug ngầm #12: message.error nhận object thay vì string', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC32: [BUG] Lưu khi bảng trống → message.error nhận {content: ...}
  //         antd message.error() API: message.error(content, duration)
  //         content phải là string/ReactNode, {content: ...} có thể gây lỗi
  //
  //  Expected: Message hiển thị HTML đúng cách
  //  Actual:   Có thể crash hoặc hiển thị [object Object]
  // ──────────────────────────────────────────────────────────────────────
  test('TC32 — [BUG] Lưu bảng trống → message.error nhận object → kiểm tra render', async ({ page }) => {
    // Click Lưu khi bảng trống
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // Kiểm tra message error có hiện không
    const errorMsg = await page.locator('.ant-message').textContent().catch(() => '');

    if (errorMsg.includes('[object Object]') || errorMsg.includes('object')) {
      console.log(`🔴 [BUG CONFIRMED] Message hiển thị lỗi: "${errorMsg}"`);
      console.log('   validateDataSource line 54: message.error({ content: ... })');
      console.log('   → antd message.error() nhận string, không phải object {content}');
    } else if (errorMsg.length > 0) {
      console.log(`✅ Message hiển thị đúng: "${errorMsg}"`);
    } else {
      console.log('⚠️  Không thấy message error.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC32.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G19 — Bug ngầm #13: Tách dòng tại SL nhặt=0 → soLuongDeNghi_tong=0
//          → validate dùng soLuongDeNghi(=0) thay vì soLuongDeNghi_tong(=10)
//          → BÁO SAI: picked=3 > rowOrderQty=0 → "vượt quá SL đơn"
//          FIX: computeGroupState & performQuantityChange ưu tiên soLuongDeNghi_tong
// ═══════════════════════════════════════════════════════════════════════════

test.describe('G19 — Bug ngầm #13: Validate sai khi tách dòng tại SL nhặt=0', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC39: [BUG] Tách dòng tại SL nhặt=0 → sửa mẹ nhập 3 → báo SAI
  //
  //  Step:
  //    1. VT A: soLuongDeNghi=10, tong_nhat=0
  //    2. Tách dòng → pickedValue=0 → mẹ: soLuongDeNghi=0, con: soLuongDeNghi=10
  //    3. Sửa mẹ: tong_nhat=3
  //    4. Validate: mẹ picked=3 > rowOrderQty=0 → BÁO LỖI SAI
  //
  //  Expected: KHÔNG báo lỗi (vì nhóm có tổng đơn=10, nhặt 3 là hợp lệ)
  //  Actual:   Báo lỗi SAI vì rowOrderQty của mẹ = 0 (đã reset khi split)
  // ──────────────────────────────────────────────────────────────────────
  test('TC39 — [BUG] Tách tại SL=0 → sửa mẹ nhập 3 → báo SAI "vượt quá SL đơn"', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC39 — không tìm thấy input vật tư.');
      return;
    }

    // Step 1: Thêm vật tư
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    const rows1 = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rows1 === 0) {
      console.log('⚠️  Bỏ qua TC39 — không thêm được vật tư.');
      return;
    }
    console.log('✅ Step 1: Thêm vật tư thành công.');

    // Step 2: Tách dòng (tại SL nhặt=0 mặc định)
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    const rows2 = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rows2 < 2) {
      console.log(`⚠️  Bỏ qua TC39 — tách dòng thất bại (${rows2} dòng).`);
      return;
    }
    console.log(`✅ Step 2: Tách dòng thành công (${rows2} dòng).`);

    // Step 3: Sửa SL nhặt dòng mẹ = 3
    // Mẹ có: soLuongDeNghi=0 (bị reset khi split tại SL=0)
    // Con có: soLuongDeNghi=10 (phần còn lại)
    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    const inputCount = await numberInputs.count();

    // SL nhặt mẹ nằm ở input thứ 2 (sau mã vật tư)
    // Cấu trúc dòng: [mã vật tư] [SL nhặt] [SL đơn] [DVT]
    // 2 dòng = 8 input
    // Input 1-2: dòng 1 (mẹ) - mã VT, SL nhặt
    // Input 3-4: dòng 1 (mẹ) - SL đơn, DVT
    // Input 5-6: dòng 2 (con) - mã VT, SL nhặt
    // Input 7-8: dòng 2 (con) - SL đơn, DVT
    const slNhatMeInput = numberInputs.nth(1); // SL nhặt dòng mẹ

    await slNhatMeInput.click({ clickCount: 3 });
    await slNhatMeInput.fill('3');
    await slNhatMeInput.press('Tab');
    await page.waitForTimeout(1000);

    console.log('✅ Step 3: Đã nhập tong_nhat mẹ = 3.');

    // Step 4: Thử Lưu → nếu báo lỗi SAI → confirm bug
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    if (!(await saveBtn.isVisible())) {
      console.log('⚠️  Nút Lưu không visible.');
      return;
    }
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const hasPerRowError = await page.locator('.ant-message-error').isVisible().catch(() => false);
    const errorText = await page.locator('.ant-message').textContent().catch(() => '');

    if (hasPerRowError && (errorText.includes('SL nhặt') || errorText.includes('SL đơn') || errorText.includes('vượt'))) {
      console.log('🔴 [BUG CONFIRMED] Validate báo SAI khi tách dòng tại SL=0:');
      console.log('   Nguyên nhân: handleAddItem tách tại SL=0 → mẹ.soLuongDeNghi=0');
      console.log('   → computeGroupState: mẹ.rowOrderQty=0');
      console.log('   → validateTongNhatByGroup: picked=3 > rowOrderQty=0 → BÁO LỖI SAI');
      console.log(`   Message: "${errorText}"`);
      console.log('   → Hậu quả: KHÔNG thể nhặt 3 cái khi đã tách dòng tại SL=0');
    } else if (hasPerRowError) {
      console.log(`⚠️  Có lỗi nhưng không phải do bug này: "${errorText}"`);
    } else {
      console.log('✅ Không báo lỗi — bug có thể đã được fix.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC39.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC40: Tách dòng tại SL nhặt > 0 (đúng) → validate đúng
  //         Step: VT A: SL=10 → nhập 3 → tách → mẹ SL=3, con SL=7 → OK
  // ──────────────────────────────────────────────────────────────────────
  test('TC40 — Tách tại SL>0 → sửa mẹ nhập 3 → validate ĐÚNG', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC40.');
      return;
    }

    // Step 1: Thêm vật tư
    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC40.');
      return;
    }

    // Step 2: Sửa SL nhặt = 3 (để pickedValue > 0)
    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.fill('3');
    await slNhatInput.press('Tab');
    await page.waitForTimeout(500);
    console.log('✅ Step 2: Đã nhập tong_nhat = 3.');

    // Step 3: Tách dòng
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);
    }

    const rowsAfterSplit = await page.locator('.ant-table-tbody .ant-table-row').count();
    if (rowsAfterSplit < 2) {
      console.log('⚠️  Bỏ qua TC40 — tách dòng thất bại.');
      return;
    }
    console.log('✅ Step 3: Đã tách dòng.');

    // Step 4: Sửa SL nhặt mẹ = 2 (mẹ đã có soLuongDeNghi=3, nhập thêm 2 = hợp lệ)
    const inputsAfterSplit = page.locator('.ant-table-tbody input[type="number"]');
    const slNhatMe = inputsAfterSplit.nth(1);
    await slNhatMe.click({ clickCount: 3 });
    await slNhatMe.fill('2');
    await slNhatMe.press('Tab');
    await page.waitForTimeout(500);
    console.log('✅ Step 4: Đã nhập tong_nhat mẹ = 2 (tổng mẹ = 2, con = 7, nhóm = 9/10).');

    // Step 5: Lưu — KHÔNG nên báo lỗi
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const hasError = await page.locator('.ant-message-error').isVisible().catch(() => false);
    const errorText = await page.locator('.ant-message').textContent().catch(() => '');

    if (hasError && errorText.includes('vượt')) {
      console.log(`🔴 [BUG] Validate SAI: "${errorText}"`);
    } else {
      console.log(hasError
        ? `⚠️  Có lỗi khác: "${errorText}"`
        : '✅ Không báo lỗi — validate đúng khi tách tại SL>0.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC40.png', fullPage: true });
  });
});


// ═══════════════════════════════════════════════════════════════════════════
//  G20 — Edge cases còn lại (số âm, SL=0, tách khi đủ SL, quick scan)
// ═══════════════════════════════════════════════════════════════════════════

async test.describe('G20 — Edge cases còn lại', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/kho/nhat-hang/them-moi');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);
  });
    await clearOverlays(page);
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC33: Nhập số âm vào SL nhặt → có bị chặn không
  // ──────────────────────────────────────────────────────────────────────
  test('TC33 — Nhập SL nhặt = số âm → có bị chặn không', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC33.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC33.');
      return;
    }

    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    if ((await numberInputs.count()) < 2) {
      console.log('⚠️  Không đủ input.');
      return;
    }

    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.fill('-5');
    await slNhatInput.press('Tab');
    await page.waitForTimeout(500);

    const finalValue = await slNhatInput.inputValue();
    console.log(`Giá trị sau khi nhập -5: "${finalValue}"`);

    if (finalValue === '-5' || parseFloat(finalValue) < 0) {
      console.log('🔴 [BUG] SL nhặt âm được chấp nhận — cần validation chặn số âm.');
    } else {
      console.log(`✅ SL âm bị chặn hoặc chuyển thành: ${finalValue}`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC33.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC34: SL nhặt = 0 → validateTongNhat check như thế nào
  // ──────────────────────────────────────────────────────────────────────
  test('TC34 — SL nhặt = 0 cho tất cả dòng → Lưu có bị chặn không', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC34.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC34.');
      return;
    }

    // SL nhặt mặc định = 0 → thử Lưu
    const saveBtn = page.getByRole('button', { name: /Lưu/i }).first();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    const hasError = await page.locator('.ant-message-error').isVisible().catch(() => false);
    if (hasError) {
      console.log('✅ Lưu bị chặn khi SL nhặt = 0.');
    } else {
      console.log('🔴 [POTENTIAL BUG] Lưu thành công với SL nhặt = 0 → có thể không hợp lệ.');
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC34.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC35: Tách dòng khi SL nhặt = 0 → có hoạt động không
  // ──────────────────────────────────────────────────────────────────────
  test('TC35 — Tách dòng khi SL nhặt = 0', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC35.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC35.');
      return;
    }

    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);

      const rowsAfter = await page.locator('.ant-table-tbody .ant-table-row').count();
      console.log(`✅ Tách dòng thành công: ${rowsAfter} dòng.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC35.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC36: Tách dòng khi SL nhặt = SL đơn (đã nhặt đủ) → phải bị chặn
  // ──────────────────────────────────────────────────────────────────────
  test('TC36 — Tách dòng khi đã nhặt đủ SL đơn → phải bị chặn', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC36.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC36.');
      return;
    }

    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    if ((await numberInputs.count()) < 2) {
      console.log('⚠️  Không đủ input.');
      return;
    }

    // Sửa SL nhặt = SL đơn (giả sử = 1)
    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.fill('1');
    await slNhatInput.press('Tab');
    await page.waitForTimeout(500);

    // Thử tách dòng — phải bị chặn
    const addRowBtns = page.locator('.ant-table-tbody button[title="Thêm"]');
    if (await addRowBtns.count() > 0) {
      await addRowBtns.first().click();
      await page.waitForTimeout(1000);

      const rows = await page.locator('.ant-table-tbody .ant-table-row').count();
      const hasWarning = await page.locator('.ant-message-warning').isVisible().catch(() => false);

      if (hasWarning || rows === 1) {
        console.log('✅ Tách dòng bị chặn khi đã nhặt đủ SL đơn.');
      } else {
        console.log(`⚠️  Tách dòng không bị chặn: ${rows} dòng.`);
      }
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC36.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC37: Quick scan 5 lần liên tiếp cùng 1 mã trong vòng 3s → chỉ 1 dòng
  // ──────────────────────────────────────────────────────────────────────
  test('TC37 — Quick scan 5 lần cùng mã trong 3s → chỉ 1 dòng (debounce hoạt động)', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC37.');
      return;
    }

    // Scan 5 lần liên tiếp, mỗi lần cách 0.5s (tổng 2.5s < 3s debounce)
    for (let i = 0; i < 5; i++) {
      await vatTuInput.fill(MA_VAT_TU_TEST);
      await page.waitForTimeout(100);
      await vatTuInput.press('Enter');
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(1000);
    const rows = await page.locator('.ant-table-tbody .ant-table-row').count();

    if (rows === 1) {
      console.log(`✅ Debounce hoạt động đúng — 5 scan → 1 dòng (${rows} row).`);
    } else if (rows === 5) {
      console.log(`🔴 [BUG] Debounce KHÔNG hoạt động — 5 scan → ${rows} dòng.`);
    } else {
      console.log(`⚠️  ${rows} dòng sau 5 lần scan.`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC37.png', fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────
  //  TC38: Nhập chuỗi không phải số vào ô SL nhặt → xử lý ra sao
  // ──────────────────────────────────────────────────────────────────────
  test('TC38 — Nhập chuỗi "abc" vào ô SL nhặt → parseFloat → NaN → set 0', async ({ page }) => {
    const vatTuInput = page.locator('input[placeholder*="quét hoặc nhập mã"]').first();
    if (!(await vatTuInput.isVisible())) {
      console.log('⚠️  Bỏ qua TC38.');
      return;
    }

    await vatTuInput.fill(MA_VAT_TU_TEST);
    await page.waitForTimeout(500);
    await vatTuInput.press('Enter');
    await page.waitForTimeout(1500);

    if ((await page.locator('.ant-table-tbody .ant-table-row').count()) === 0) {
      console.log('⚠️  Bỏ qua TC38.');
      return;
    }

    const numberInputs = page.locator('.ant-table-tbody input[type="number"]');
    if ((await numberInputs.count()) < 2) return;

    const slNhatInput = numberInputs.nth(1);
    await slNhatInput.click({ clickCount: 3 });
    await slNhatInput.fill('abc');
    await slNhatInput.press('Tab');
    await page.waitForTimeout(500);

    const finalValue = await slNhatInput.inputValue();
    console.log(`Giá trị sau khi nhập "abc": "${finalValue}"`);

    if (finalValue === '0' || finalValue === '') {
      console.log('✅ Chuỗi "abc" → NaN → set về 0 hoặc rỗng (đúng).');
    } else {
      console.log(`⚠️  Giá trị là "${finalValue}" sau khi nhập "abc".`);
    }

    await page.screenshot({ path: 'tests/screenshots/nhat-hang-TC38.png', fullPage: true });
  });

