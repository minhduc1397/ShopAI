import { z } from 'zod';

export const CategorySchema = z.enum(['gaming', 'computer', 'phone', 'audio', 'camera', 'home']);

// Khuôn mẫu 1 sản phẩm hợp lệ — các trường mới để optional cho tương thích giỏ hàng đã lưu từ bản cũ
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  price: z.number().positive('Giá sản phẩm phải lớn hơn 0'),
  image: z.string().url('Đường dẫn ảnh phải là URL hợp lệ'),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: CategorySchema.optional(),
  rating: z.number().min(0).max(5).optional(),
  stock: z.number().int().nonnegative().optional(),
});

// Khuôn mẫu cho cả một Danh sách (Mảng) sản phẩm trả về từ API
export const ProductListSchema = z.array(ProductSchema);

export const CategoryListSchema = z.array(
  z.object({ id: CategorySchema, label: z.string(), count: z.number() }),
);

// Tự động suy ra Type TypeScript từ Schema Zod
export type Product = z.infer<typeof ProductSchema>;
export type ProductCategory = z.infer<typeof CategorySchema>;
export type CategoryInfo = z.infer<typeof CategoryListSchema>[number];
