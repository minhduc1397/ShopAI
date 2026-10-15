import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect(); // Mở kết nối khi NestJS khởi động Module này
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Đóng kết nối gọn gàng khi Server tắt
  }
}
