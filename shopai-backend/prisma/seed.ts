import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PRODUCTS } from '../src/product/product.data';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  await prisma.user.upsert({
    where: { email: 'demo@shopai.com' },
    update: {},
    create: {
      email: 'demo@shopai.com',
      password: hashedPassword, // Lưu bản ĐÃ HASH
      name: 'Học viên Demo',
    },
  });
  console.log('✅ Đã seed User demo: demo@shopai.com / 123456');

  // Tùy chọn (Nghiệm thu mục 13): seed Product vào Database
  for (const { id, name, price, image } of PRODUCTS) {
    await prisma.product.upsert({
      where: { id },
      update: { name, price, image },
      create: { id, name, price, image },
    });
  }
  console.log(`✅ Đã seed ${PRODUCTS.length} Product vào Database`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
