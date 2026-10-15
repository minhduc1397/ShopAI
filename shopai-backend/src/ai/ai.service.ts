import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Content, GoogleGenerativeAI } from '@google/generative-ai';
import { ProductService } from '../product/product.service';
import { buildSystemPrompt } from './ai.prompt';

export type ChatHistoryItem = { role: 'user' | 'model'; text: string };

const MAX_HISTORY_TURNS = 10;

// Nơi DUY NHẤT trong toàn hệ thống được cầm Gemini API Key
@Injectable()
export class AiService {
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly modelName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-3.8-flash';
  }

  async chat(
    message: string,
    history: ChatHistoryItem[] = [],
  ): Promise<string> {
    if (!this.genAI) {
      throw new ServiceUnavailableException(
        'Server chưa cấu hình GEMINI_API_KEY trong file .env',
      );
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      // Prompt ghép catalog THẬT — AI tư vấn đúng hàng, đúng giá đang bán
      systemInstruction: buildSystemPrompt(
        this.productService.getAllProducts(),
      ),
      generationConfig: { temperature: 0.4, topP: 0.9, maxOutputTokens: 2048 },
    });

    // Đổi { role, text } từ Mobile thành định dạng Gemini Content[]
    // (Gemini yêu cầu lượt đầu tiên của history phải là 'user')
    const recent = history.slice(-MAX_HISTORY_TURNS);
    const firstUser = recent.findIndex((h) => h.role === 'user');
    const geminiHistory: Content[] = (
      firstUser === -1 ? [] : recent.slice(firstUser)
    ).map((h) => ({ role: h.role, parts: [{ text: h.text }] }));

    try {
      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error: unknown) {
      // Giữ nguyên mã lỗi của Google (429/503...) để Mobile hiện câu báo lỗi thân thiện
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number(error.status)
          : HttpStatus.BAD_GATEWAY;
      const msg = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Gemini lỗi: ${msg}`,
        Number.isFinite(status) && status >= 400
          ? status
          : HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
