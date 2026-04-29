/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU XUẤT ĐIỀU CHUYỂN
 * ============================================================================
 *  Module: Kho > Phiếu xuất điều chuyển
 *  Route:  /kho/xuat-dieu-chuyen
 * ============================================================================
 */

const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth.helper');

// Helper to clear notifications
async function clearOverlays(page) {
  const closeButtons = page.locator('.ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(300);
}

test.describe('Nghiệp vụ Kho — Phiếu xuất điều chuyển', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC01 — Trang danh sách hiển thị đầy đủ và đúng quy trình', async ({ page }) => {
    await page.goto('/kho/xuat-dieu-chuyen');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Tiêu đề
    await expect(page.locator('.phieu-title')).toContainText('PHIẾU XUẤT ĐIỀU CHUYỂN');

    // Các cột chính trong bảng
    const headerRow = page.locator('.ant-table-thead');
    await expect(headerRow.getByText('Chứng từ')).toBeVisible();
    await expect(headerRow.getByText('Kho Xuất -> Nhập')).toBeVisible();
    await expect(headerRow.getByText('Trạng thái')).toBeVisible();
    await expect(headerRow.getByText('Hành động')).toBeVisible();

    // Nút tạo mới
    await expect(page.getByRole('button', { name: /Tạo mới/i })).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/xuat-dieu-chuyen-list.png', fullPage: true });
  });

  test('TC02 — Luồng tạo mới phiếu xuất điều chuyển (E2E)', async ({ page }) => {
    await page.goto('/kho/xuat-dieu-chuyen/them-moi');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await clearOverlays(page);

    // 1. Chọn Kho xuất
    // Click vào Select bằng ID (Antd Form.Item name="maKhoXuat" -> id="maKhoXuat")
    const issueWhInput = page.locator('#maKhoXuat');
    await issueWhInput.click();
    await page.waitForTimeout(1000);
    
    const issueWhOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option').first();
    await issueWhOption.waitFor({ state: 'visible', timeout: 5000 });
    await issueWhOption.click();
    console.log(`- Đã chọn Kho xuất.`);

    // 2. Chọn Kho nhận
    const receiptWhInput = page.locator('#maKhoNhap');
    await receiptWhInput.click();
    await page.waitForTimeout(1000);
    
    // Chọn option thứ 2
    const receiptWhOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option');
    if (await receiptWhOption.count() > 1) {
        await receiptWhOption.nth(1).click();
    } else {
        await receiptWhOption.first().click();
    }
    console.log(`- Đã chọn Kho nhận.`);

    // 3. Nhập người giao
    await page.locator('#ong_ba').fill('Người giao Demo');

    // 4. Thêm vật tư
    console.log('- Đang tìm chọn vật tư...');
    const vatTuSelectInput = page.locator('.ant-col-24').filter({ hasText: 'Chi tiết' }).locator('.ant-select-selection-search-input');
    await vatTuSelectInput.click();
    await page.waitForTimeout(500);
    
    // Gõ phím "a" để kích hoạt tìm kiếm
    await vatTuSelectInput.fill('a');
    await page.waitForTimeout(2000); // Đợi API trả về kết quả
    
    // Đợi dropdown hiện ra và chọn option đầu tiên
    const vatTuOption = page.locator('.ant-select-dropdown:visible .ant-select-item-option');
    await expect(vatTuOption.first()).toBeVisible({ timeout: 15000 });
    
    const vatTuName = await vatTuOption.first().innerText();
    await vatTuOption.first().click();
    console.log(`- Đã thêm vật tư: ${vatTuName}`);
    
    // Đợi vật tư xuất hiện trong bảng table
    const rowLocator = page.locator('.ant-table-tbody .ant-table-row').first();
    await expect(rowLocator).toBeVisible({ timeout: 10000 });
    
    // Nhập số lượng
    const quantityInput = rowLocator.locator('.ant-input-number-input, input[type="text"]').last();
    await quantityInput.click();
    await page.waitForTimeout(500);
    await quantityInput.fill('10');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'tests/screenshots/xuat-dieu-chuyen-add-data-filled.png' });

    // 5. Lưu phiếu
    await page.getByRole('button', { name: 'Lưu phiếu' }).click();
    
    // Đợi message thành công hoặc redirect
    await page.waitForTimeout(2000);
    console.log('✅ Đã nhấn nút Lưu phiếu.');
    
    await page.waitForURL(/.*xuat-dieu-chuyen$/, { timeout: 15000 });
    console.log('✅ Redirect về danh sách thành công.');
    
    await page.screenshot({ path: 'tests/screenshots/xuat-dieu-chuyen-add-success.png' });
  });

  test('TC03 — Luồng xem chi tiết và chỉnh sửa phiếu', async ({ page }) => {
    await page.goto('/kho/xuat-dieu-chuyen');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Click vào nút "Xem chi tiết" (FileTextOutlined) của dòng đầu tiên
    const firstRow = page.locator('.ant-table-tbody .ant-table-row').first();
    await firstRow.locator('.phieu-action-btn--view').click();
    
    await expect(page).toHaveURL(/.*chi-tiet.*/);
    await expect(page.getByText('CHI TIẾT PHIẾU XUẤT ĐIỀU CHUYỂN')).toBeVisible();
    console.log('- Đã vào trang chi tiết thành công.');

    // Click nút Chỉnh sửa (trong trang chi tiết) - Thường là nút có icon Edit hoặc chữ "Sửa"
    // Nếu trong trang chi tiết có nút "Chỉnh sửa"
    const editBtn = page.getByRole('button', { name: /Chỉnh sửa/i }).or(page.locator('.phieu-action-btn--edit'));
    if (await editBtn.first().isVisible()) {
        await editBtn.first().click();
        console.log('- Đã bật chế độ chỉnh sửa.');
    }

    // Thay đổi diễn giải
    const dienGiaiInput = page.getByPlaceholder('Nhập diễn giải');
    await dienGiaiInput.fill('Chỉnh sửa bởi AutoTest ' + new Date().getTime());

    // Lưu lại
    const saveBtn = page.getByRole('button', { name: /Lưu/i });
    await saveBtn.click();

    // Verify
    await page.waitForTimeout(2000);
    await expect(page.locator('.ant-message-success')).toBeVisible();
    console.log('✅ Chỉnh sửa phiếu thành công.');

    await page.screenshot({ path: 'tests/screenshots/xuat-dieu-chuyen-edit-result.png', fullPage: true });
  });

  test('TC04 — Kiểm tra xóa phiếu', async ({ page }) => {
    await page.goto('/kho/xuat-dieu-chuyen');
    await page.waitForLoadState('networkidle');
    await clearOverlays(page);

    // Lấy số chứng từ của dòng đầu tiên để verify sau khi xóa
    const firstRow = page.locator('.ant-table-tbody .ant-table-row').first();
    const sct = await firstRow.locator('.ant-typography').first().innerText();
    
    // Click nút Xóa (DeleteOutlined)
    await firstRow.locator('.phieu-action-btn--delete').click();

    // Xác nhận trong Popconfirm của Antd
    const confirmBtn = page.locator('.ant-popover:visible').getByRole('button', { name: 'Xác nhận' });
    await confirmBtn.click();

    await page.waitForTimeout(2000);
    await expect(page.locator('.ant-message-success')).toBeVisible();
    console.log(`✅ Đã xóa phiếu: ${sct}`);
  });

});
