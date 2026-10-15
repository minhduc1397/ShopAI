import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ProductModule], // Mượn catalog để đưa vào System Prompt
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
