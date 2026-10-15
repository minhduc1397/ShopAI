import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { IOrderRepository, OrderRecord } from './order.repository';
import { OrderService } from './order.service';

// Repository giả lưu trong RAM — chứng minh Repository Pattern: đổi nguồn dữ liệu, Service không đổi
class InMemoryOrderRepository implements IOrderRepository {
  orders: OrderRecord[] = [];
  save(input: Omit<OrderRecord, 'status' | 'createdAt'>) {
    const order = { ...input, status: 'PENDING', createdAt: new Date() };
    this.orders.push(order);
    return Promise.resolve(order);
  }
  findAll() {
    return Promise.resolve(this.orders);
  }
  findByUserId(userId: string) {
    return Promise.resolve(this.orders.filter((o) => o.userId === userId));
  }
  findById(id: string) {
    return Promise.resolve(this.orders.find((o) => o.id === id) ?? null);
  }
  updateStatus(id: string, status: string) {
    const order = this.orders.find((o) => o.id === id)!;
    order.status = status;
    return Promise.resolve(order);
  }
}

describe('OrderService', () => {
  let service: OrderService;
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository();
    service = new OrderService(new ProductService(), repo);
  });

  it('Server tự tính tổng tiền và lưu giá snapshot', async () => {
    // prod_1 = 1.890.000 x2, prod_5 = 890.000 x1
    const order = await service.createOrder(
      {
        items: [
          { productId: 'prod_1', quantity: 2 },
          { productId: 'prod_5', quantity: 1 },
        ],
        total: 4670000,
      },
      'u1',
    );
    expect(order.total).toBe(4670000);
    expect(order.status).toBe('PENDING');
    expect(order.items[0]).toMatchObject({
      productId: 'prod_1',
      price: 1890000,
    });
  });

  it('Client gửi tổng tiền gian lận → 400', async () => {
    await expect(
      service.createOrder(
        { items: [{ productId: 'prod_11', quantity: 1 }], total: 1000 },
        'u1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Sản phẩm không tồn tại → 400', async () => {
    await expect(
      service.createOrder(
        { items: [{ productId: 'prod_999', quantity: 1 }], total: 0 },
        'u1',
      ),
    ).rejects.toThrow('không còn tồn tại');
  });

  it('Không xem được hóa đơn của người khác', async () => {
    const order = await service.createOrder(
      { items: [{ productId: 'prod_2', quantity: 1 }], total: 1250000 },
      'u1',
    );
    await expect(
      service.getOrderForUser(order.id, 'u2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('Pay: PENDING → PAID, bấm lần 2 vẫn PAID (idempotent)', async () => {
    const order = await service.createOrder(
      { items: [{ productId: 'prod_2', quantity: 1 }], total: 1250000 },
      'u1',
    );
    expect((await service.payOrder(order.id, 'u1')).status).toBe('PAID');
    expect((await service.payOrder(order.id, 'u1')).status).toBe('PAID');
  });
});
