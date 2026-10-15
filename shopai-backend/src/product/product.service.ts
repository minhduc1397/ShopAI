import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CATEGORY_LABELS,
  PRODUCTS,
  ProductCategory,
  ProductEntity,
} from './product.data';

export interface ProductFilter {
  category?: string;
  q?: string;
}

// Bỏ dấu tiếng Việt để tìm "tai nghe" vẫn ra "Tai nghe", "ban phim" ra "Bàn phím"
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // NFD tách "à" thành "a" + dấu huyền → xóa mọi dấu kết hợp
    .toLowerCase()
    .replace(/đ/g, 'd')
    .trim();

@Injectable()
export class ProductService {
  // Kho dữ liệu sinh MỘT LẦN lúc Service khởi tạo — id luôn ổn định (Bước 7c)
  private readonly products: ProductEntity[] = PRODUCTS;

  getAllProducts(filter: ProductFilter = {}) {
    const keyword = filter.q ? normalize(filter.q) : '';
    return this.products.filter((p) => {
      if (filter.category && p.category !== filter.category) return false;
      if (!keyword) return true;
      return normalize(`${p.name} ${p.brand}`).includes(keyword);
    });
  }

  getCategories() {
    return (Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      count: this.products.filter((p) => p.category === id).length,
    }));
  }

  getProductById(id: string) {
    const product = this.findRawById(id);
    if (!product) {
      // Đúng chuẩn Phần 9.6: KHÔNG return null, phải ném đúng mã 404
      throw new NotFoundException(`Không tìm thấy sản phẩm có id = ${id}`);
    }
    return product;
  }

  // Dùng lại ở Orders API (Bước 7f) để Server tự tra giá thật
  findRawById(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }
}
