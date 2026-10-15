import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/product.schema';

/** Luật riêng của ShopAI: tối đa 10 sản phẩm cùng loại / đơn (và không vượt tồn kho nếu Server báo) */
export const MAX_QTY_PER_ITEM = 10;

export const maxQtyFor = (product: Product) => Math.min(MAX_QTY_PER_ITEM, product.stock ?? MAX_QTY_PER_ITEM);

// Một dòng trong Giỏ hàng = Sản phẩm gốc + số lượng đang chọn
export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  increaseItem: (productId: string) => void;
  /** Giảm 1; về 0 thì tự xóa dòng khỏi giỏ */
  decreaseItem: (productId: string) => void;
  totalQuantity: () => number;
  totalPrice: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Nếu sản phẩm đã có trong giỏ -> Chỉ tăng quantity. Chưa có -> Thêm dòng mới.
      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + 1, maxQtyFor(item)) }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      increaseItem: (productId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: Math.min(item.quantity + 1, maxQtyFor(item)) }
              : item,
          ),
        }));
      },

      decreaseItem: (productId) => {
        set((state) => ({
          items: state.items
            .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
            .filter((item) => item.quantity > 0),
        }));
      },

      // Dùng get() để tính toán "on-demand" thay vì lưu sẵn một State thừa dễ lệch dữ liệu
      totalQuantity: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'shopai-cart-storage', // "Chìa khóa" lưu trong AsyncStorage — đổi tên này sẽ mất dữ liệu cũ
      storage: createJSONStorage(() => AsyncStorage),
      // Chỉ lưu mảng `items` xuống ổ cứng — không lưu các hàm addItem/removeItem/...
      // (Zustand persist mặc định cũng tự bỏ qua hàm khi JSON.stringify, nhưng khai báo rõ ràng hơn)
      partialize: (state) => ({ items: state.items }) as CartState,
    },
  ),
);
