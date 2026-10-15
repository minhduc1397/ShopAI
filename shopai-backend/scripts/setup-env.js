// Tạo shopai-backend/.env từ .env.example nếu chưa có, tự sinh JWT_SECRET ngẫu nhiên.
// Chạy tự động trong `npm run db:setup` — clone về máy mới là chạy được ngay.
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { randomBytes } = require('crypto');
const { join } = require('path');

const root = join(__dirname, '..');
const envPath = join(root, '.env');

if (existsSync(envPath)) {
  console.log('✓ Đã có .env — giữ nguyên.');
} else {
  const template = readFileSync(join(root, '.env.example'), 'utf8');
  const secret = randomBytes(32).toString('base64');
  writeFileSync(envPath, template.replace(/^JWT_SECRET=$/m, `JWT_SECRET=${secret}`));
  console.log('✓ Đã tạo .env (JWT_SECRET ngẫu nhiên). Muốn chat AI: điền GEMINI_API_KEY trong shopai-backend/.env');
}
