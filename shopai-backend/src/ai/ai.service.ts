import {
  GatewayTimeoutException,
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
type Provider = 'deepseek' | 'gemini';

const MAX_HISTORY_TURNS = 10;
// Trợ lý chỉ trả lời ngắn (< 60 chữ) → giới hạn token để nhanh và rẻ
const MAX_OUTPUT_TOKENS = 400;
const DEEPSEEK_TIMEOUT_MS = 30_000;
// Mỗi model Gemini chỉ được chờ chừng này rồi chuyển sang model dự phòng
const GEMINI_ATTEMPT_TIMEOUT_MS = 20_000;
// Gemini tính cả token "suy nghĩ ngầm" vào giới hạn → cần rộng hơn; độ dài thật do prompt quyết định
const GEMINI_MAX_OUTPUT_TOKENS = 1024;
// Model chính + dự phòng: 3.5-flash ổn định & nhanh; 3.8-flash hay quá tải / hết hạn mức
const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

class RetryableAiError extends Error {}

/**
 * Nơi DUY NHẤT trong hệ thống cầm API Key của AI.
 * Chọn nhà cung cấp bằng .env (AI_PROVIDER / key nào có mặt) — Controller và App Mobile không cần biết.
 * Gọi thẳng REST (không qua SDK) để tự kiểm soát timeout và tự chuyển model khi quá tải.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: Provider | null;
  private readonly deepseekKey?: string;
  private readonly deepseekModel: string;
  private readonly deepseekBaseUrl: string;
  private readonly geminiKey?: string;
  private readonly geminiModels: string[];
  // Catalog cố định trong RAM → prompt giống hệt nhau mỗi lần gọi, nhà cung cấp tự cache phần đầu prompt
  private readonly systemPrompt: string;
  // Model Gemini trả lời thành công gần nhất — lần sau thử nó trước
  private lastGoodGeminiModel?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
  ) {
    this.deepseekKey =
      this.configService.get<string>('DEEPSEEK_API_KEY') || undefined;
    this.deepseekModel =
      this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
    this.deepseekBaseUrl =
      this.configService.get<string>('DEEPSEEK_BASE_URL') ||
      'https://api.deepseek.com';

    this.geminiKey =
      this.configService.get<string>('GEMINI_API_KEY') || undefined;
    const primary =
      this.configService.get<string>('GEMINI_MODEL') ||
      DEFAULT_GEMINI_MODELS[0];
    const fallbacks = (
      this.configService.get<string>('GEMINI_FALLBACK_MODELS') ??
      DEFAULT_GEMINI_MODELS.join(',')
    )
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    this.geminiModels = [...new Set([primary, ...fallbacks])];

    const preferred = this.configService.get<string>('AI_PROVIDER');
    if (preferred === 'gemini' && this.geminiKey) this.provider = 'gemini';
    else if (preferred === 'deepseek' && this.deepseekKey)
      this.provider = 'deepseek';
    else if (this.deepseekKey) this.provider = 'deepseek';
    else if (this.geminiKey) this.provider = 'gemini';
    else this.provider = null;

    this.systemPrompt = buildSystemPrompt(this.productService.getAllProducts());
    this.logger.log(
      `AI provider: ${this.provider ?? 'chưa cấu hình'}${
        this.provider === 'gemini' ? ` (${this.geminiModels.join(' → ')})` : ''
      }`,
    );
  }

  getProviderInfo() {
    if (this.provider === 'deepseek')
      return { provider: 'deepseek', model: this.deepseekModel };
    if (this.provider === 'gemini') {
      return {
        provider: 'gemini',
        model: this.lastGoodGeminiModel ?? this.geminiModels[0],
        fallbacks: this.geminiModels,
      };
    }
    return { provider: null, model: null };
  }

  async chat(
    message: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    // Gemini/DeepSeek đều cần lượt đầu tiên của lịch sử là 'user'
    const recent = history.slice(-MAX_HISTORY_TURNS);
    const firstUser = recent.findIndex((h) => h.role === 'user');
    const cleanHistory = firstUser === -1 ? [] : recent.slice(firstUser);

    if (this.provider === 'deepseek')
      return this.chatDeepSeek(message, cleanHistory);
    if (this.provider === 'gemini')
      return this.chatGemini(message, cleanHistory);
    throw new ServiceUnavailableException(
      'Server chưa cấu hình API key AI (DEEPSEEK_API_KEY hoặc GEMINI_API_KEY) trong file .env',
    );
  }

  // ---------------- DeepSeek (API kiểu OpenAI) ----------------
  private async chatDeepSeek(
    message: string,
    history: ChatHistoryItem[],
  ): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.deepseekBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.deepseekKey}`,
        },
        body: JSON.stringify({
          model: this.deepseekModel,
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...history.map((h) => ({
              role: h.role === 'model' ? 'assistant' : 'user',
              content: h.text,
            })),
            { role: 'user', content: message },
          ],
          temperature: 0.4,
          max_tokens: MAX_OUTPUT_TOKENS,
          stream: false,
        }),
        signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException(
          'DeepSeek phản hồi quá lâu, thử lại sau nhé',
        );
      }
      throw new HttpException(
        'Không kết nối được DeepSeek',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      this.logger.warn(`DeepSeek ${response.status}: ${detail.slice(0, 200)}`);
      // 401 sai key, 402 hết số dư, 429 quá tải — giữ nguyên mã để Mobile báo lỗi đúng bệnh
      const reason: Record<number, string> = {
        401: 'API key DeepSeek không hợp lệ',
        402: 'Tài khoản DeepSeek đã hết số dư',
        429: 'DeepSeek đang quá tải (429), thử lại sau vài giây',
      };
      throw new HttpException(
        reason[response.status] ?? `DeepSeek lỗi (HTTP ${response.status})`,
        response.status >= 400 ? response.status : HttpStatus.BAD_GATEWAY,
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply)
      throw new HttpException(
        'DeepSeek không trả về nội dung',
        HttpStatus.BAD_GATEWAY,
      );
    return reply;
  }

  // ---------------- Gemini (REST + chuỗi model dự phòng) ----------------
  private async chatGemini(
    message: string,
    history: ChatHistoryItem[],
  ): Promise<string> {
    const order = this.lastGoodGeminiModel
      ? [
          this.lastGoodGeminiModel,
          ...this.geminiModels.filter((m) => m !== this.lastGoodGeminiModel),
        ]
      : this.geminiModels;

    let lastError: unknown;
    for (const model of order) {
      try {
        const reply = await this.callGeminiModel(model, message, history);
        this.lastGoodGeminiModel = model;
        return reply;
      } catch (error) {
        lastError = error;
        if (!(error instanceof RetryableAiError)) throw error; // sai key... → báo ngay, không thử tiếp
        this.logger.warn(
          `Gemini ${model}: ${error.message} → thử model kế tiếp`,
        );
      }
    }
    this.logger.error(`Mọi model Gemini đều lỗi: ${String(lastError)}`);
    throw new ServiceUnavailableException(
      'Trợ lý AI đang quá tải ở mọi model, bạn thử lại sau ít phút nhé',
    );
  }

  private async callGeminiModel(
    model: string,
    message: string,
    history: ChatHistoryItem[],
  ): Promise<string> {
    // Gemini 3 "suy nghĩ ngầm" mặc định — đặt mức thấp để không ngốn hết token và trả lời nhanh
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
            'x-goog-api-key': this.geminiKey!,
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
              maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
              thinkingConfig,
            },
          }),
          signal: AbortSignal.timeout(GEMINI_ATTEMPT_TIMEOUT_MS),
        },
      );
    } catch (error) {
      const reason =
        error instanceof Error && error.name === 'TimeoutError'
          ? 'quá 20s'
          : 'lỗi mạng';
      throw new RetryableAiError(reason);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      // 429 hết hạn mức, 503 quá tải, 404 model không có với key này, 500 lỗi tạm → thử model khác
      if ([404, 429, 500, 503].includes(response.status)) {
        throw new RetryableAiError(`HTTP ${response.status}`);
      }
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
