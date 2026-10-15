import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { OrderModule } from './order/order.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Đọc .env, dùng ConfigService ở mọi Module
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), // Rate limit theo IP (Phần 9.10)
    PrismaModule,
    ProductModule,
    AiModule,
    AuthModule,
    OrderModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
