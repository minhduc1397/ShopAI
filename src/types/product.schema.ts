import { z } from 'zod';

// Khuôn mẫu 1 sản phẩm hợp lệ
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  price: z.number().positive('Giá sản phẩm phải lớn hơn 0'),
  image: z.string().url('Đường dẫn ảnh phải là URL hợp lệ'),
  description: z.string().optional(),
});

// Khuôn mẫu cho cả một Danh sách (Mảng) sản phẩm trả về từ API
export const ProductListSchema = z.array(ProductSchema);

// Tự động suy ra Type TypeScript từ Schema Zod
export type Product = z.infer<typeof ProductSchema>;