export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "electronics" | "fashion" | "books" | "home";
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Tai nghe Sony WH-1000XM4",
    price: 6490000,
    // Ảnh chụp cận cảnh tai nghe over-ear
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    category: "electronics",
  },
  {
    id: "2",
    name: "Sách Clean Code - Robert C. Martin",
    price: 320000,
    // Ảnh sách bìa cứng thật
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    category: "books",
  },
  {
    id: "3",
    name: "Máy ảnh Fujifilm X-T4 Mirrorless",
    price: 38900000,
    // Ảnh body máy ảnh kèm ống kính
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    category: "electronics",
  },
  {
    id: "4",
    name: "Giày Sneaker Nike Air Max",
    price: 3290000,
    // Ảnh chụp giày thể thao đỏ/trắng
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    category: "fashion",
  },
  {
    id: "5",
    name: "Đồng hồ Thông minh Apple Watch",
    price: 8990000,
    // Ảnh đồng hồ thông minh thực tế
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    category: "electronics",
  },
  {
    id: "6",
    name: "Chậu Cây Xanh Monstera Mini",
    price: 180000,
    // Ảnh chậu cây để bàn
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80",
    category: "home",
  },
  {
    id: "7",
    name: "Kính râm Ray-Ban Aviator Cổ điển",
    price: 3650000,
    // Ảnh kính mắt thời trang
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
    category: "fashion",
  },
  {
    id: "8",
    name: "Đèn Bàn Đọc Sách Phong Cách Bắc Âu",
    price: 450000,
    // Ảnh đèn bàn decor
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
    category: "home",
  },
];