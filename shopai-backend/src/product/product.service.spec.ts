import { NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';

describe('ProductService — tìm kiếm & lọc', () => {
  const service = new ProductService();
  const ids = (q?: string, category?: string) =>
    service.getAllProducts({ q, category }).map((p) => p.id);

  it('gõ không dấu vẫn ra sản phẩm có dấu ("ban phim" → Bàn phím)', () => {
    expect(ids('ban phim')).toEqual(
      expect.arrayContaining(['prod_1', 'prod_7', 'prod_23']),
    );
  });

  it('không phân biệt hoa thường và xử lý chữ đ ("DONG HO" → Đồng hồ)', () => {
    expect(ids('DONG HO')).toContain('prod_14');
  });

  it('tìm theo tên hãng', () => {
    expect(ids('sony')).toEqual(
      expect.arrayContaining(['prod_8', 'prod_18', 'prod_21']),
    );
  });

  it('lọc theo danh mục kết hợp từ khóa', () => {
    const result = service.getAllProducts({ category: 'audio', q: 'tai nghe' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.category === 'audio')).toBe(true);
  });

  it('danh mục trả đủ 6 nhóm và tổng số lượng khớp catalog', () => {
    const categories = service.getCategories();
    expect(categories).toHaveLength(6);
    expect(categories.reduce((s, c) => s + c.count, 0)).toBe(
      service.getAllProducts().length,
    );
  });

  it('id không tồn tại → NotFoundException (404)', () => {
    expect(() => service.getProductById('prod_999')).toThrow(NotFoundException);
  });
});
