// src/services/geminiService.ts
import axiosClient from '@api/axiosClient';

/** Cùng tinh thần ChatTurn Chương 8 — đơn giản hóa khi gửi Nest */
export type ChatTurn = {
  role: 'user' | 'model';
  parts?: { text: string }[];
  text?: string;
};

/** Gọi NestJS /api/ai/chat — Server cầm Gemini Key bảo mật tuyệt đối */
export const askShopAI = async (
  question: string,
  history: ChatTurn[] = [],
): Promise<string> => {
  const { data } = await axiosClient.post<{ reply: string }>('/api/ai/chat', {
    message: question,
    history: history.map((h) => ({
      role: h.role,
      text: h.parts?.[0]?.text ?? h.text ?? '',
    })),
  });
  return data.reply;
};

/** Chuyển thông báo lỗi kỹ thuật thành câu chữ mà người dùng đọc hiểu được. */
export const toFriendlyError = (error: unknown): string => {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('429')) return 'Trợ lý đang bận (quá nhiều yêu cầu). Bạn đợi vài giây rồi thử lại nhé.';
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable'))
    return 'Mô hình AI đang quá tải tạm thời. Bạn đợi một chút rồi bấm Thử lại nhé.';
  if (msg.includes('API key') || msg.includes('401') || msg.includes('403'))
    return 'Lỗi xác thực với Server AI.';
  if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Network Error') || msg.includes('ECONNREFUSED'))
    return 'Không kết nối được tới Server ShopAI. Bạn kiểm tra lại backend nhé.';
  if (msg.includes('bộ lọc an toàn')) return msg;

  return 'Trợ lý gặp sự cố tạm thời. Bạn thử lại giúp mình nhé.';
};
