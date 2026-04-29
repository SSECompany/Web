/* eslint-disable */
/**
 * auth.helper.js — Module đăng nhập dùng chung cho tất cả E2E tests.
 *
 * Luồng Login thực tế của ứng dụng:
 *  1. Nhập username → debounce 300ms → gọi API lấy danh sách Đơn vị.
 *  2. Hệ thống tự chọn Đơn vị đầu tiên.
 *  3. Nhập password.
 *  4. Click "Đăng nhập" → gọi API Login.
 *  5. Redirect khỏi /login.
 *  6. Đóng notification "Cập nhật phiên bản" nếu có.
 */

const { expect } = require('@playwright/test');

/**
 * Thực hiện đăng nhập vào hệ thống.
 */
async function login(page, username = 'sse2', password = '123abc') {
  await page.goto('/login');

  // ① Chờ form login hiển thị
  const usernameInput = page.locator('#login_form_username');
  await usernameInput.waitFor({ state: 'visible', timeout: 15000 });

  // ② Nhập username
  await usernameInput.fill(username);

  // ③ Nhập password
  await page.locator('#login_form_password').fill(password);

  // ④ Đợi API DVCS trả về danh sách Đơn vị (debounce 300ms + network)
  await page.waitForTimeout(2500);

  // ⑤ Click nút Đăng nhập
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  // ⑥ Chờ redirect khỏi /login
  await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 30000 });

  // ⑦ Đóng mọi notification/alert popup (VD: "Cập nhật phiên bản")
  //    để tránh chúng che UI và làm fail các click tiếp theo.
  await dismissNotifications(page);
}

/**
 * Đóng tất cả notification popups đang hiện trên trang.
 * Bao gồm: ant-notification-notice, ant-message, ant-alert.
 */
async function dismissNotifications(page) {
  await page.waitForTimeout(1000); // Chờ notification hiện ra

  // Đóng tất cả notification bằng nút Close
  const closeButtons = page.locator('.ant-notification-notice .ant-notification-notice-close');
  const count = await closeButtons.count();
  for (let i = 0; i < count; i++) {
    await closeButtons.nth(i).click({ force: true }).catch(() => {});
  }

  // Đóng cả alert (VD: VersionIndicator) nếu có
  const alertClose = page.locator('.ant-alert .ant-notification-notice-close, [aria-label="Close"]').filter({ has: page.locator('.ant-notification') });
  // Fallback: click tất cả close buttons trên notification container
  const allNotifClose = page.locator('.ant-notification .ant-notification-notice-close');
  const allCount = await allNotifClose.count();
  for (let i = 0; i < allCount; i++) {
    await allNotifClose.nth(i).click({ force: true }).catch(() => {});
  }

  await page.waitForTimeout(500);
}

module.exports = { login, dismissNotifications };
