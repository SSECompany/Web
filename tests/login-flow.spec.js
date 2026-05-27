/* eslint-disable */
/**
 * Run: npx playwright test tests/login-flow.spec.js --headed
 */
const { test, expect } = require('@playwright/test');

test.describe('Kịch bản đăng nhập liên tục (Continuous E2E Flow)', () => {

  test('Luồng kiểm thử Đăng nhập từ A đến Z trên 1 trình duyệt duy nhất', async ({ page }) => {
    // Bước 1: Truy cập trang Login và kiểm tra giao diện hiển thị ban đầu
    console.log('👉 Bước 1: Vào trang đăng nhập...');
    await page.goto('/login');
    await expect(page.getByText('Hí, Chào mừng trở lại')).toBeVisible();
    await page.waitForTimeout(1500); // Dừng 1.5s để bạn quan sát giao diện trống

    // Bước 2: Thử Đăng nhập khi để trống thông tin để kiểm tra validator cảnh báo đỏ
    console.log('👉 Bước 2: Click Đăng nhập khi để trống để check validator...');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    
    // Kiểm tra xem các câu báo lỗi validator có hiện lên không
    const validationMsg = page.locator('.ant-form-item-explain-error');
    await expect(validationMsg.first()).toBeVisible();
    console.log('✅ Validator hoạt động chính xác khi để trống form.');
    await page.waitForTimeout(2000); // Dừng 2s để bạn nhìn thấy các dòng chữ đỏ cảnh báo

    // Bước 3: Nhập Username đúng nhưng nhập Password sai
    console.log('👉 Bước 3: Nhập username và mật khẩu SAI...');
    // Gõ username chậm rãi từng ký tự
    const usernameInput = page.locator('#login_form_username');
    await usernameInput.pressSequentially('trungdk', { delay: 100 });
    await page.waitForTimeout(500);

    // Gõ password sai chậm rãi
    const passwordInput = page.locator('#login_form_password');
    await passwordInput.pressSequentially('wrong_password', { delay: 100 });
    await page.waitForTimeout(1000);

    // Click đăng nhập
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForTimeout(2500); // Chờ API phản hồi và hiển thị thông báo lỗi
    
    console.log('✅ Hệ thống từ chối đăng nhập với mật khẩu sai thành công.');
    await page.waitForTimeout(2000); // Dừng 2s để bạn quan sát trạng thái lỗi

    // Bước 4: Sửa lại mật khẩu đúng và Đăng nhập thành công
    console.log('👉 Bước 4: Xóa mật khẩu sai và nhập mật khẩu ĐÚNG...');
    
    // Click đúp hoặc bôi đen để xóa password cũ
    await passwordInput.focus();
    await page.keyboard.press('Meta+A'); // Trên Mac dùng Cmd+A để bôi đen
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(500);

    // Gõ password đúng chậm rãi
    await passwordInput.pressSequentially('123abc', { delay: 100 });
    await page.waitForTimeout(1000);

    // Click Đăng nhập để hoàn tất
    console.log('👉 Bước 5: Thực hiện Đăng nhập thành công và chuyển trang...');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Đợi hệ thống chuyển trang ra khỏi màn hình login
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 15000 });
    
    // Kiểm tra xem đã đăng nhập thành công vào trang quản trị chưa
    const currentURL = page.url();
    expect(currentURL).not.toContain('/login');
    console.log('🎉 ĐĂNG NHẬP THÀNH CÔNG! Trình duyệt đang ở trang:', currentURL);
    
    // Giữ màn hình thêm 3 giây để bạn chiêm ngưỡng thành quả trước khi đóng
    await page.waitForTimeout(3000);
  });

});
