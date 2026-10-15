// src/constants/env.ts — Chương 10, Bước 0: MỘT nguồn sự thật cho môi trường chạy
// ⚠️ File này nằm trong bundle JS (đọc được khi dịch ngược APK): chỉ để URL/cờ, KHÔNG để bí mật.
export type AppEnv = 'development' | 'staging' | 'production';

// __DEV__ = true khi chạy qua Metro, false ở bản build Release
export const APP_ENV: AppEnv = __DEV__ ? 'development' : 'production';

const API_URLS: Record<AppEnv, string> = {
  // Máy ảo Android / điện thoại cắm USB: chạy `npm run adb:reverse` rồi dùng localhost.
  // Điện thoại qua Wi-Fi không cắm cáp: đổi thành IP LAN của laptop, VD 'http://192.168.1.15:3000'.
  development: 'http://localhost:3000',
  // Bản Release dùng để demo vẫn trỏ về laptop chạy Nest (chưa có server public)
  staging: 'http://localhost:3000',
  production: 'http://localhost:3000',
};

export const API_BASE_URL = API_URLS[APP_ENV];

// Cờ bật/tắt tính năng theo môi trường — tránh làm nhiễu dữ liệu giám sát lúc đang code
export const ENABLE_CRASH_REPORTING = APP_ENV !== 'development';
export const ENABLE_OTA_UPDATE = APP_ENV !== 'development';

export const APP_VERSION = '1.1.0';
