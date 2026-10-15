# shopai-backend — NestJS API cho ShopAI (Chương 9)

```bash
npm install
npm run db:setup     # tự tạo .env (JWT_SECRET ngẫu nhiên) + migrate SQLite + seed demo@shopai.com / 123456
npm run start:dev    # http://localhost:3000 — Swagger: /api/docs
```

| Endpoint | Ghi chú |
|---|---|
| `GET /api/products?category=&q=` | Danh sách, lọc danh mục, tìm không dấu |
| `GET /api/products/categories` | Danh mục + số lượng |
| `GET /api/products/:id` | 404 tiếng Việt nếu sai id |
| `POST /api/auth/register` · `POST /api/auth/login` | Trả `{ accessToken, user }` (JWT) |
| `GET /api/auth/me` 🔒 | Hồ sơ + số đơn + tổng đã thanh toán |
| `POST /api/orders` 🔒 | Server tự tính lại tổng tiền, sai → 400 |
| `GET /api/orders` · `GET /api/orders/:id` 🔒 | Chỉ đơn của chính user |
| `POST /api/orders/:id/pay` 🔒 | PENDING → PAID (idempotent) |
| `POST /api/ai/chat` | Proxy Gemini, prompt kèm catalog thật, rate limit 10 req/phút |
| `GET /api/health` | Cho chấm "Server online" trên app |

Test: `npm test` (unit, mock Prisma) · `npm run test:e2e` (Supertest, DB riêng `prisma/test.db`).
