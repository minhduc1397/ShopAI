import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors(); // Để test bằng trình duyệt/Swagger — Mobile không bị CORS chặn

  // Trạm kiểm soát dữ liệu vào cho TOÀN BỘ endpoint (Phần 9.5)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger phải đặt TRƯỚC app.listen
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ShopAI API')
    .setDescription('Backend phục vụ App React Native ShopAI (Chương 9)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  // 0.0.0.0 = lắng nghe mọi card mạng → điện thoại thật cùng Wifi gọi được
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 ShopAI API: http://localhost:${port}/api/docs`);
}
void bootstrap();
