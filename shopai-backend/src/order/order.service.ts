import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CreateOrderDto } from './dto/create-order.dto';
import type { IOrderRepository, OrderRecord } from './order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly productService: ProductService,
    // Tiêm qua token chuỗi → đổi Prisma/In-memory mà không sửa dòng nào ở đây
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async createOrder(dto: CreateOrderDto, userId: string) {
    let serverTotal = 0;
    const enrichedItems: {
      productId: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of dto.items) {
      const product = this.productService.findRawById(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Sản phẩm ${item.productId} không còn tồn tại`,
        );
      }
      serverTotal += product.price * item.quantity; // Giá lấy từ KHO CỦA SERVER
      enrichedItems.push({ ...item, price: product.price });
    }

    // Đối chiếu với con số Mobile gửi lên (Phần 9.12 mục 2)
    if (serverTotal !== dto.total) {
      throw new BadRequestException(
        `Tổng tiền không khớp. Server tính ${serverTotal}, Client gửi ${dto.total}. Vui lòng tải lại giỏ hàng.`,
      );
    }

    const order = await this.orderRepository.save({
      id: `ORD-${Date.now()}`,
      userId,
      total: serverTotal, // Luôn ghi con số của SERVER
      items: enrichedItems,
    });
    return this.withProductInfo(order);
  }

  async getOrdersForUser(userId: string) {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders.map((o) => this.withProductInfo(o));
  }

  async getOrderForUser(orderId: string, userId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    return this.withProductInfo(order);
  }

  async payOrder(orderId: string, userId: string) {
    const order = await this.getOrderForUser(orderId, userId);
    if (order.status === 'PAID') {
      return order; // Idempotent — bấm Pay lần 2 không lỗi
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể thanh toán đơn ở trạng thái ${order.status}`,
      );
    }
    // Giả lập cổng thanh toán — Production sẽ verify webhook
    const paid = await this.orderRepository.updateStatus(orderId, 'PAID');
    return this.withProductInfo(paid);
  }

  // Gắn thêm tên + ảnh sản phẩm để màn Chi tiết hóa đơn hiển thị được (giá vẫn là snapshot)
  private withProductInfo(order: OrderRecord) {
    return {
      ...order,
      items: order.items.map((it) => {
        const product = this.productService.findRawById(it.productId);
        return {
          ...it,
          name: product?.name ?? it.productId,
          image: product?.image ?? null,
        };
      }),
    };
  }
}
