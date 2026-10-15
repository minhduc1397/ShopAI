import { MAX_QTY_PER_ITEM, useCartStore } from '../src/store/useCartStore';
import type { Product } from '../src/types/product.schema';

const keyboard: Product = {
  id: 'prod_1',
  name: 'Bàn phím cơ ATK68',
  price: 1890000,
  image: 'https://example.com/k.jpg',
  stock: 24,
};
const camera: Product = {
  id: 'prod_21',
  name: 'Máy ảnh mirrorless',
  price: 21990000,
  image: 'https://example.com/c.jpg',
  stock: 4, // tồn kho thấp hơn giới hạn 10
};

const cart = () => useCartStore.getState();

describe('useCartStore — logic tiền của giỏ hàng', () => {
  beforeEach(() => cart().clearCart());

  it('thêm cùng sản phẩm 2 lần → gộp thành 1 dòng, quantity = 2', () => {
    cart().addItem(keyboard);
    cart().addItem(keyboard);
    expect(cart().items).toHaveLength(1);
    expect(cart().items[0].quantity).toBe(2);
  });

  it('totalPrice / totalQuantity tính đúng trên nhiều dòng', () => {
    cart().addItem(keyboard);
    cart().addItem(keyboard);
    cart().addItem(camera);
    expect(cart().totalQuantity()).toBe(3);
    expect(cart().totalPrice()).toBe(1890000 * 2 + 21990000);
  });

  it(`không vượt quá ${MAX_QTY_PER_ITEM} sản phẩm cùng loại`, () => {
    for (let i = 0; i < 15; i++) cart().addItem(keyboard);
    expect(cart().items[0].quantity).toBe(MAX_QTY_PER_ITEM);
  });

  it('không vượt quá tồn kho Server báo về', () => {
    for (let i = 0; i < 8; i++) cart().increaseItem(camera.id); // chưa có trong giỏ → bỏ qua
    expect(cart().items).toHaveLength(0);
    for (let i = 0; i < 8; i++) cart().addItem(camera);
    expect(cart().items[0].quantity).toBe(4);
  });

  it('decreaseItem về 0 thì tự xóa dòng khỏi giỏ', () => {
    cart().addItem(keyboard);
    cart().addItem(keyboard);
    cart().decreaseItem(keyboard.id);
    expect(cart().items[0].quantity).toBe(1);
    cart().decreaseItem(keyboard.id);
    expect(cart().items).toHaveLength(0);
  });

  it('removeItem chỉ xóa đúng sản phẩm được chọn', () => {
    cart().addItem(keyboard);
    cart().addItem(camera);
    cart().removeItem(keyboard.id);
    expect(cart().items.map((i) => i.id)).toEqual([camera.id]);
  });
});
