import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('Ai')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Endpoint đắt tiền → siết riêng (Phần 9.10)
  @ApiOperation({ summary: 'Chat với trợ lý AI (Server cầm Gemini Key)' })
  async chat(@Body() body: ChatDto) {
    const reply = await this.aiService.chat(body.message, body.history ?? []);
    return { reply };
  }
}
