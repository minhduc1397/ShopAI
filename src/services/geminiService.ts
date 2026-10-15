// src/services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@constants/geminiConfig';
import {
  GEMINI_GENERATION_CONFIG,
  GEMINI_MODEL_NAME,
  MAX_HISTORY_TURNS,
  SHOPAI_SYSTEM_PROMPT,
} from '@constants/aiPrompt';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL_NAME,
  systemInstruction: SHOPAI_SYSTEM_PROMPT, // Đặt ở đây thay vì nhét vào tin nhắn (Phần 8.9, nguyên tắc 3)
  generationConfig: GEMINI_GENERATION_CONFIG,
});

/** Một lượt hội thoại theo đúng định dạng Gemini yêu cầu. */
export type ChatTurn = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

/**
 * Gửi câu hỏi kèm lịch sử hội thoại lên Gemini.
 *
 * @param question Câu hỏi mới của user
 * @param history  Các lượt trước đó (đã theo định dạng Gemini). Nhờ có nó, AI mới
 *                 hiểu được câu "cái đó giá bao nhiêu?" đang nói về sản phẩm nào.
 */
export const askShopAI = async (question: string, history: ChatTurn[] = []): Promise<string> => {
  // Cắt bớt lịch sử: chỉ giữ N lượt gần nhất để không phình chi phí (Phần 8.11)
  const trimmed = history.slice(-MAX_HISTORY_TURNS * 2);

  const sendMessageWithRetry = async (retries = 1): Promise<string> => {
    try {
      const chat = model.startChat({ history: trimmed });
      const result = await chat.sendMessage(question);
      const text = result.response.text();

      // Bộ lọc an toàn có thể chặn câu trả lời -> text rỗng (Phần 8.9)
      if (!text || !text.trim()) {
        throw new Error('AI không trả lời được câu này (có thể đã bị bộ lọc an toàn chặn).');
      }

      return text.trim();
    } catch (err: any) {
      if (retries > 0 && err?.message && (err.message.includes('503') || err.message.includes('high demand'))) {
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), 1200);
        });
        return sendMessageWithRetry(retries - 1);
      }
      throw err;
    }
  };

  return sendMessageWithRetry();
};

/** Chuyển thông báo lỗi kỹ thuật thành câu chữ mà người dùng đọc hiểu được. */
export const toFriendlyError = (error: unknown): string => {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('429')) return 'Trợ lý đang bận (quá nhiều yêu cầu). Bạn đợi vài giây rồi thử lại nhé.';
  if (msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable'))
    return 'Mô hình AI đang quá tải tạm thời. Bạn đợi một chút rồi bấm Thử lại nhé.';
  if (msg.includes('API key') || msg.includes('401') || msg.includes('403'))
    return 'API Key chưa đúng. Hãy kiểm tra lại file geminiConfig.ts.';
  if (msg.includes('Network') || msg.includes('fetch')) return 'Mất kết nối mạng. Bạn kiểm tra Wi-Fi/4G giúp mình nhé.';
  if (msg.includes('bộ lọc an toàn')) return msg;

  return 'Trợ lý gặp sự cố tạm thời. Bạn thử lại giúp mình nhé.';
};
