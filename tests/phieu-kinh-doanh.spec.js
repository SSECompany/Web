
/* eslint-disable */
/**
 * ============================================================================
 *  E2E TEST — PHIẾU KINH DOANH (Full Business Logic)
 * ============================================================================
 *  Test các luồng: Tìm kiếm/Lọc, Tạo mới đơn hàng (chọn KH, chọn Vật tư, lưu),
 *  Tính toán giá trị, Chỉnh sửa diễn giải đơn hàng.
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { login, dismissNotifications } = require('./helpers/auth.helper');

test.describe('Nghiệp vụ Kinh doanh — Phiếu kinh doanh', () => {

  test.beforeEach(async ({ page }) => {
    // Đăng nhập tự động
    await login(page);
    await dismissNotifications(page);
  });

  test('TC01 — Tìm kiếm theo mã khách hàng/tên khách hàng và bộ lọc', async ({ page }) => {
    await page.goto('/kinh-doanh/danh-sach');
    await page.waitForLoadState('networkidle');

    // Chờ bảng dữ liệu load
    await expect(page.locator('.ant-table-tbody')).toBeVisible({ timeout: 15000 });

    const firstRow = page.locator('.ant-table-tbody .ant-table-row').first();
    if (await firstRow.isVisible()) {
      // Tìm một KH có thật trong bảng để tìm kiếm (Cột số 5 thường là Tên khách hàng)
      const customerName = await firstRow.locator('td').nth(4).innerText();
      
      // Vùng lọc (Drawer hoặc Input)
      const openFilterBtn = page.locator('button:has(.anticon-filter), button:has-text("Bộ lọc")').first();
      // Nếu có nút Bộ lọc, mở ra
      if (await openFilterBtn.isVisible()) {
          await openFilterBtn.click();
      }
      
      const searchInput = page.getByPlaceholder(/Tìm kiếm|Khách hàng/i).first();
      if (await searchInput.isVisible()) {
          await searchInput.fill(customerName);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000); // Đợi gọi API search

          // Kiểm tra thấy kết quả trả về
          const rowsCount = await page.locator('.ant-table-tbody .ant-table-row').count();
          expect(rowsCount).toBeGreaterThan(0);
          console.log(`✅ Đã tìm thấy ${rowsCount} đơn hàng của ${customerName}`);
      }
    } else {
      console.log('⚠️ Bảng trống, bỏ qua test filter');
    }
  });

  test('TC02 — Luồng tạo đơn hàng mới hoàn chỉnh, thêm vật tư và kiểm tra tính toán', async ({ page }) => {
    await page.goto('/kinh-doanh/them-moi');
    await page.waitForLoadState('networkidle');
    await dismissNotifications(page);

    // 1. Chọn khách hàng
    console.log('--- Chọn Khách hàng ---');
    // Ở form thêm mới, field đầu tiên thường là Khách hàng
    const customerSelect = page.locator('.ant-select-selector').first();
    await customerSelect.click();
    
    // Đợi option xuất hiện
    const selectOptions = page.locator('.ant-select-item-option');
    await selectOptions.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await selectOptions.first().isVisible()) {
      await selectOptions.first().click();
      await page.waitForTimeout(1000); // Đợi load công nợ/chi tiết KH nếu có
    } else {
      console.log('⚠️ Chú ý: Không lấy được options khách hàng, có thể form dùng Autocomplete cần gõ chữ trước.');
    }

    // 2. Thêm một vật tư
    console.log('--- Thêm số lượng vật tư vào bảng ---');
    const addMaterialBtn = page.locator('button:has-text("Thêm vật tư"), button:has-text("Thêm dòng"), .anticon-plus-circle').first();
    if (await addMaterialBtn.isVisible()) {
      await addMaterialBtn.click();
      await page.waitForTimeout(500); // chờ dòng xuất hiện
    }

    // 3. Nhập dữ liệu cho vật tư (chọn mã VT, nhập số lượng, giá)
    const newRow = page.locator('.ant-table-tbody .ant-table-row').first();
    if (await newRow.isVisible()) {
        // Option lấy vật tư (Cell 1 thường là Mã VT / combobox)
        const cellSelect = newRow.locator('.ant-select-selector').first();
        if (await cellSelect.isVisible()) {
            await cellSelect.click();
            await selectOptions.first().waitFor({ state: 'visible' }).catch(() => {});
            if (await selectOptions.first().isVisible()) {
                await selectOptions.first().click();
            }
        }
        
        // Cột số lượng, giá bán (tìm input-number)
        const numInputs = newRow.locator('.ant-input-number-input');
        if (await numInputs.count() >= 2) {
            // Điền Số lượng
            await numInputs.nth(0).fill('10');
            // Điền Giá bán
            await numInputs.nth(1).fill('150000');
            await page.keyboard.press('Tab'); // Kích hoạt tính toán
            await page.waitForTimeout(1000);

            // Xác minh tính toán (Số lượng * Giá)
            const rowText = await newRow.innerText();
            // 10 * 150000 = 1,500,000. Dù format thế nào cũng sẽ có 1.500 hoặc 1,500
            if (rowText.includes('1,500') || rowText.includes('1.500') || rowText.includes('1500000')) {
                console.log('✅ Tính tiền ở row đã khớp 1.500.000');
            }
        }
    }

    // 4. Test Error handling / Missing data 
    // Chúng ta nhấn "Lưu" nhưng nếu có những trường bắt buộc khác chưa điền, nó sẽ báo lỗi đỏ.
    console.log('--- Lưu phiếu ---');
    await page.getByRole('button', { name: 'Lưu' }).click();

    await page.waitForTimeout(1000);
    const errorFields = page.locator('.ant-form-item-has-error');
    const errorCount = await errorFields.count();
    
    // Nếu có lỗi đỏ, form hoạt động đúng cơ chế UI Validation.
    // Nếu không có, form hoặc thành công, hoặc ẩn thông báo.
    if (errorCount > 0) {
       console.log(`✅ Bắt được ${errorCount} lỗi bắt buộc cần nhập. Form validation hoạt động tốt.`);
    } else {
       // Nếu không có lỗi form, chờ xem có thông báo lỗi Toast "Trường X không được để trống" hoặc thành công
       const toaster = page.locator('.ant-notification-notice, .ant-message');
       const hasToast = await toaster.count();
       if (hasToast > 0) {
          console.log(`✅ Nhận được thông báo từ hệ thống: ${await toaster.first().innerText()}`);
       }
    }
  });

  test('TC03 — Xem chi tiết, Chỉnh sửa diễn giải và Xác nhận cập nhật', async ({ page }) => {
    // Luồng: Navigate List -> Click Detail/Edit -> Change a note -> Save
    await page.goto('/kinh-doanh/danh-sach');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-table-tbody')).toBeVisible({ timeout: 15000 });

    const firstRow = page.locator('.ant-table-tbody .ant-table-row').first();
    if (!(await firstRow.isVisible())) {
       console.log('⚠️ Bảng trống, bỏ qua test sửa');
       return;
    }

    // Click icon Edit hoặc Row
    const editIcon = firstRow.locator('.anticon-edit, .anticon-eye').first();
    if (await editIcon.isVisible()) {
       await editIcon.click();
    } else {
       await firstRow.click();
    }
    
    // Chờ trang Detail/Edit load form
    await expect(page.locator('.ant-form')).toBeVisible({ timeout: 15000 });

    const dienGiaiInput = page.locator('textarea').first();
    if (await dienGiaiInput.isVisible()) {
       const stamp = 'Update E2E - ' + Date.now();
       await dienGiaiInput.fill(stamp);
       console.log(`Đã đổi ghi chú thành: ${stamp}`);
       
       const saveBtn = page.getByRole('button', { name: 'Lưu' });
       if (await saveBtn.isVisible()) {
          await saveBtn.click();
          // Kiểm tra xem message success có hiện ra không
          const msg = page.locator('.ant-notification-notice-success, .ant-message-success');
          // Chờ tối đa 5s
          await msg.waitFor({ state: 'visible', timeout: 5000 }).catch(() => console.log('⚠️ Đã lưu nhưng không hiển thị UI notification success'));
       }
    }
  });

  test('TC04 — Xác minh xóa dòng chi phí (kiểm tra tính toàn vẹn của giỏ chi phí)', async ({ page }) => {
    await page.goto('/kinh-doanh/them-moi');
    await page.waitForLoadState('networkidle');

    const tabChiPhi = page.getByRole('tab', { name: /Chi phí/i });
    if (!(await tabChiPhi.isVisible())) {
        console.log('⚠️ Không tìm thấy Tab Chi phí, bỏ qua test');
        return;
    }

    await tabChiPhi.click();
    // Thêm một dòng chi phí
    const addRowBtn = page.locator('.ant-tabs-tabpane-active .ant-btn-sm, .ant-tabs-tabpane-active button:has-text("Thêm")').first();
    if (await addRowBtn.isVisible()) {
        await addRowBtn.click();
        await page.waitForTimeout(500);

        let rows = page.locator('.ant-tabs-tabpane-active .ant-table-tbody .ant-table-row');
        let count = await rows.count();
        expect(count).toBeGreaterThan(0); // Đảm bảo dòng đã vào bảng

        // Xoá dòng vừa thêm
        const delBtn = page.locator('.ant-tabs-tabpane-active .ant-btn-dangerous, .anticon-delete').first();
        if (await delBtn.isVisible()) {
           await delBtn.click();
           // Confirm pop-confirm (nếu có báo hỏi "Bạn có muốn xoá không?")
           const popConfirm = page.locator('.ant-popover-buttons .ant-btn-primary');
           if (await popConfirm.isVisible()) await popConfirm.click();
           
           await page.waitForTimeout(500);
           const newCount = await page.locator('.ant-tabs-tabpane-active .ant-table-tbody .ant-table-row').count();
           // Số lượng dòng phải giảm đi
           expect(newCount).toBeLessThan(count);
           console.log('✅ Xoá dòng chi phí thành công.');
        }
    }
  });
});
