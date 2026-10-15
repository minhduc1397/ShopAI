import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import type { App } from 'supertest/types';

// E2E dùng Database SQLite RIÊNG (test.db) — không đụng dữ liệu demo trong dev.db
const root = join(__dirname, '..');
const testDb = join(root, 'prisma', 'test.db');
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'e2e-secret';
process.env.GEMINI_API_KEY = '';

describe('ShopAI API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let orderId: string;

  beforeAll(async () => {
    if (existsSync(testDb)) rmSync(testDb);
    execSync('npx prisma migrate deploy', {
      cwd: root,
      stdio: 'ignore',
      env: { ...process.env }, // Jest sandbox process.env → phải truyền tay cho tiến trình con
    });

    // Nạp SAU khi set env để PrismaClient đọc đúng DATABASE_URL
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('../src/app.module') as {
      AppModule: new () => unknown;
    };
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (existsSync(testDb)) rmSync(testDb);
  });

  it('GET /api/products → danh sách có id ổn định', async () => {
    const res = await request(app.getHttpServer()).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(20);
  });

  it('GET /api/products?category=audio chỉ trả đồ âm thanh', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/products?category=audio',
    );
    expect(
      res.body.every((p: { category: string }) => p.category === 'audio'),
    ).toBe(true);
  });

  it('GET /api/products/:id sai → 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/products/nope');
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/register → 201 + accessToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'e2e@shopai.com', password: '123456', name: 'E2E' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /api/auth/register trùng email → 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'e2e@shopai.com', password: '123456' });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login → 200 + JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e@shopai.com', password: '123456' });
    expect(res.status).toBe(200);
    token = res.body.accessToken;
  });

  it('POST /api/orders không Token → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ productId: 'prod_1', quantity: 1 }], total: 1890000 });
    expect(res.status).toBe(401);
  });

  it('POST /api/orders có Token → 201 PENDING', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: 'prod_1', quantity: 1 }], total: 1890000 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    orderId = res.body.id;
  });

  it('POST /api/orders/:id/pay → PAID', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/orders/${orderId}/pay`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PAID');
  });

  it('GET /api/auth/me → thống kê đúng tổng chi tiêu', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ orderCount: 1, totalSpent: 1890000 });
  });
});
