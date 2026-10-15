import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductService } from '../product/product.service';
import { buildSystemPrompt } from './ai.prompt';

export type ChatHistoryItem = { role: 'user' | 'model'; text: string };

const MAX_HISTORY_TURNS = 10;
// Mỗi model chỉ được chờ chừng này rồi chuyển sang model dự phòng
const ATTEMPT_TIMEOUT_MS = 20_000;
// Gemini tính cả token "suy nghĩ ngầm" vào giới hạn; độ dài thật của câu trả lời do prompt quyết định
const MAX_OUTPUT_TOKENS = 1024;
// Model chính + dự phòng: 3.5-flash ổn định & nhanh; 3.8-flash hay quá tải / hết hạn mức
const DEFAULT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Lỗi tạm thời của một model (quá tải, hết hạn mức, timeout…) → được phép thử model kế tiếp */
class RetryableAiError extends Error {}

/**
 * Nơi DUY NHẤT trong hệ thống cầm Gemini API Key (Chương 9 — "Vệ sĩ AI").
 * Gọi thẳng REST thay vì SDK để tự kiểm soát timeout và tự chuyển model khi quá tải.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey?: string;
  private readonly models: string[];
  // Catalog cố định trong RAM → prompt giống hệt nhau mỗi lần gọi, Gemini tự cache phần đầu prompt
  private readonly systemPrompt: string;
  // Model trả lời thành công gần nhất — lần sau thử nó trước
  private lastGoodModel?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || undefined;
    const primary =
      this.configService.get<string>('GEMINI_MODEL') || DEFAULT_MODELS[0];
    const fallbacks = (
      this.configService.get<string>('GEMINI_FALLBACK_MODELS') ??
      DEFAULT_MODELS.join(',')
    )
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    this.models = [...new Set([primary, ...fallbacks])];
    this.systemPrompt = buildSystemPrompt(this.productService.getAllProducts());
    this.logger.log(
      this.apiKey
        ? `Gemini: ${this.models.join(' → ')}`
        : 'Gemini: chưa có GEMINI_API_KEY',
    );
  }

  getStatus() {
    return {
      configured: !!this.apiKey,
      model: this.lastGoodModel ?? this.models[0],
      fallbacks: this.models,
    };
  }

  async chat(
    message: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Server chưa cấu hình GEMINI_API_KEY trong file .env',
      );
    }

    // Gemini yêu cầu lượt đầu tiên của lịch sử là 'user'
    const recent = history.slice(-MAX_HISTORY_TURNS);
    const firstUser = recent.findIndex((h) => h.role === 'user');
    const cleanHistory = firstUser === -1 ? [] : recent.slice(firstUser);

    const order = this.lastGoodModel
      ? [
          this.lastGoodModel,
          ...this.models.filter((m) => m !== this.lastGoodModel),
        ]
      : this.models;

    for (const model of order) {
      try {
        const reply = await this.callModel(model, message, cleanHistory);
        this.lastGoodModel = model;
        return reply;
      } catch (error) {
        if (!(error instanceof RetryableAiError)) throw error; // sai key… → báo ngay, không thử tiếp
        this.logger.warn(
          `Gemini ${model}: ${error.message} → thử model kế tiếp`,
        );
      }
    }
    throw new ServiceUnavailableException(
      'Trợ lý AI đang quá tải ở mọi model, bạn thử lại sau ít phút nhé',
    );
  }

  private async callModel(
    model: string,
    message: string,
    history: ChatHistoryItem[],
  ): Promise<string> {
    // Gemini 3 "suy nghĩ ngầm" mặc định — đặt mức thấp để trả lời nhanh, không ngốn hết token
    const thinkingConfig = model.startsWith('gemini-3')
      ? { thinkingLevel: 'low' }
      : { thinkingBudget: 0 };

    let response: Response;
    try {
      response = await fetch(
        `${GEMINI_BASE_URL}/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey!,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: this.systemPrompt }] },
            contents: [
              ...history.map((h) => ({
                role: h.role,
                parts: [{ text: h.text }],
              })),
              { role: 'user', parts: [{ text: message }] },
            ],
            generationConfig: {
              temperature: 0.4,
              topP: 0.9,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              thinkingConfig,
            },
          }),
          signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
        },
      );
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      throw new RetryableAiError(timedOut ? 'quá 20s' : 'lỗi mạng');
    }

    if (!response.ok) {
      // 404 model không có với key này, 429 hết hạn mức, 500/503 quá tải tạm → thử model khác
      if ([404, 429, 500, 503].includes(response.status)) {
        throw new RetryableAiError(`HTTP ${response.status}`);
      }
      const detail = await response.text().catch(() => '');
      this.logger.warn(
        `Gemini ${model} ${response.status}: ${detail.slice(0, 200)}`,
      );
      const reason: Record<number, string> = {
        400: 'Yêu cầu gửi Gemini không hợp lệ',
        401: 'API key Gemini không hợp lệ',
        403: 'API key Gemini không có quyền dùng model này',
      };
      throw new HttpException(
        reason[response.status] ?? `Gemini lỗi (HTTP ${response.status})`,
        response.status >= 400 ? response.status : HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] };
        finishReason?: string;
      }[];
    };
    const candidate = data.candidates?.[0];
    const reply = candidate?.content?.parts
      ?.filter((p) => !p.thought && p.text)
      .map((p) => p.text)
      .join('')
      .trim();
    if (!reply || candidate?.finishReason === 'MAX_TOKENS') {
      // Rỗng / bị bộ lọc chặn / bị cắt cụt giữa chừng → không gửi câu dở cho khách, thử model khác
      throw new RetryableAiError(
        `câu trả lời không dùng được (${candidate?.finishReason ?? 'unknown'})`,
      );
    }
    return reply;
  }
}
