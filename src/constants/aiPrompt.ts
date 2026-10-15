// src/constants/aiPrompt.ts
// Từ Chương 9: System Prompt + cấu hình Gemini đã chuyển lên Server
// (shopai-backend/src/ai/ai.prompt.ts). App Mobile chỉ còn phần giao diện chat.

/** Câu chào mở màn, hiển thị ngay khi vào màn hình Chat. */
export const AI_GREETING = 'Chào bạn! Mình là trợ lý AI của ShopAI. Bạn muốn tư vấn sản phẩm gì ạ?';

/** Gợi ý câu hỏi cho trạng thái rỗng (Phần 8.10) — bám theo catalog thật của ShopAI. */
export const AI_SUGGESTIONS = [
  'Tai nghe chống ồn nào đáng mua?',
  'Bàn phím cơ cho người mới?',
  'Laptop nào hợp để lập trình?',
];

/** Chỉ gửi N lượt hội thoại gần nhất lên AI — chống phình chi phí (Phần 8.11). */
export const MAX_HISTORY_TURNS = 10;
