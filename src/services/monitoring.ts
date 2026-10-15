// src/services/monitoring.ts — Chương 10: giám sát lỗi (Crash / Non-Fatal / Breadcrumb)
//
// Thiết kế "cắm-rút": toàn app chỉ gọi monitoring.log / recordError / setAttributes.
// - Mặc định (chưa có tài khoản Firebase): ghi console + lưu 50 sự kiện gần nhất trong RAM,
//   xem được ở tab Tài khoản → "Nhật ký giám sát" (tiện demo trước hội đồng).
// - Khi có Firebase: gọi setCrashReporter(crashlyticsAdapter) MỘT lần ở index.js
//   (hướng dẫn chi tiết trong README) — không phải sửa màn hình nào.
import { APP_ENV, ENABLE_CRASH_REPORTING } from '@constants/env';

export interface CrashReporter {
  log: (message: string) => void;
  recordError: (error: Error, name?: string) => void;
  setAttributes: (attrs: Record<string, string>) => void;
  setUserId: (id: string) => void;
  crash: () => void;
}

export type MonitorEvent = {
  at: string;
  kind: 'log' | 'error';
  message: string;
};

const MAX_EVENTS = 50;
const events: MonitorEvent[] = [];
let attributes: Record<string, string> = { app_env: APP_ENV };
let reporter: CrashReporter | null = null;

const push = (event: MonitorEvent) => {
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.pop();
};

const safely = (fn: () => void) => {
  // Công cụ giám sát hỏng thì KHÔNG được kéo sập App theo
  try {
    fn();
  } catch {
    /* nuốt lỗi */
  }
};

export const setCrashReporter = (next: CrashReporter | null) => {
  reporter = next;
};

export const monitoring = {
  /** Breadcrumb — "vụn bánh mì" để lần ngược lại chuyện gì xảy ra trước khi lỗi */
  log(message: string) {
    push({ at: new Date().toISOString(), kind: 'log', message });
    if (__DEV__) console.log(`[monitor] ${message}`);
    if (ENABLE_CRASH_REPORTING && reporter) safely(() => reporter!.log(message));
  },

  /** Lỗi Non-Fatal: App vẫn sống, nhưng đội kỹ thuật được báo */
  recordError(error: unknown, name = 'NonFatal') {
    const err = error instanceof Error ? error : new Error(String(error));
    push({ at: new Date().toISOString(), kind: 'error', message: `${name}: ${err.message}` });
    if (__DEV__) console.warn(`[monitor] ${name}:`, err.message);
    if (ENABLE_CRASH_REPORTING && reporter) safely(() => reporter!.recordError(err, name));
  },

  /** Custom Keys — gắn bối cảnh vào mọi báo cáo sau đó */
  setAttributes(next: Record<string, string>) {
    attributes = { ...attributes, ...next };
    if (ENABLE_CRASH_REPORTING && reporter) safely(() => reporter!.setAttributes(next));
  },

  setUserId(id: string) {
    attributes = { ...attributes, user_id: id };
    if (reporter) safely(() => reporter!.setUserId(id));
  },

  /** Test crash — CHỈ cho phép khi __DEV__ (chặn ở tầng gọi lẫn ở đây) */
  testCrash() {
    if (!__DEV__) return;
    this.log('Dev bấm giữ dòng phiên bản để test crash');
    if (reporter) {
      reporter.crash();
      return;
    }
    // Chưa có Crashlytics: ném lỗi thật để ErrorBoundary + RedBox bắt được
    throw new Error('ShopAI test crash (Chương 10)');
  },

  getEvents: (): readonly MonitorEvent[] => events,
  getAttributes: () => attributes,
};
