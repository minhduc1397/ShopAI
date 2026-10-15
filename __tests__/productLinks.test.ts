import { extractProductIds } from '../src/utils/productLinks';

describe('extractProductIds — nút "Xem sản phẩm" trong Chat AI', () => {
  it('tách đúng mã sản phẩm trong câu trả lời', () => {
    const reply = 'Bạn xem Bàn phím 65% (prod_23) giá 1.690.000đ hoặc ATK68 (prod_1) nhé.';
    expect(extractProductIds(reply)).toEqual(['prod_23', 'prod_1']);
  });

  it('bỏ mã trùng và giới hạn tối đa 3 nút', () => {
    const reply = 'prod_5, prod_5, prod_13, prod_18, prod_22';
    expect(extractProductIds(reply)).toEqual(['prod_5', 'prod_13', 'prod_18']);
  });

  it('không có mã → mảng rỗng (không hiện nút)', () => {
    expect(extractProductIds('Dạ mình chỉ tư vấn đồ công nghệ thôi ạ.')).toEqual([]);
  });
});
