// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // Chạy tuần tự cho ổn định

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Chỉ 1 worker để test tuần tự, tránh xung đột session

  reporter: [
    ['html', { open: 'never' }],
    ['list'], // Hiện kết quả realtime trên terminal
  ],

  use: {
    baseURL: 'http://127.0.0.1:3000',
    
    // Tracing & screenshot khi lỗi — cực hữu ích cho debug
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15000,  // timeout cho mỗi action (click, fill…)
    navigationTimeout: 30000,
  },

  // Chỉ chạy trên Chromium cho nhanh. Bỏ comment để test đa trình duyệt.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Tự khởi chạy dev server trước khi test (bỏ comment nếu muốn)
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
