// src/services/catalogApi.ts — mọi lời gọi API sản phẩm gom về một chỗ (Home, Detail, Scanner dùng chung)
import { API_BASE_URL } from '@constants/api';
import { monitoring } from '@services/monitoring';
import {
  CategoryInfo,
  CategoryListSchema,
  Product,
  ProductListSchema,
  ProductSchema,
} from '../types/product.schema';

/** Phân loại lỗi để UI nói đúng bệnh: mất kết nối khác hẳn Server trả dữ liệu bẩn */
export type CatalogErrorKind = 'network' | 'server' | 'not_found' | 'invalid_data';

export class CatalogError extends Error {
  constructor(
    public readonly kind: CatalogErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}

const getJson = async (path: string): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new CatalogError(
      'network',
      `Không kết nối được Server (${API_BASE_URL}). Kiểm tra backend đã chạy và adb reverse chưa.`,
    );
  }
  if (response.status === 404) {
    throw new CatalogError('not_found', 'Sản phẩm này không còn tồn tại trên hệ thống');
  }
  if (!response.ok) {
    throw new CatalogError('server', `Server lỗi (HTTP ${response.status}), thử lại sau nhé`);
  }
  return response.json();
};

export type ProductQuery = { category?: string | null; q?: string };

export const fetchProducts = async ({ category, q }: ProductQuery = {}): Promise<Product[]> => {
  const params: string[] = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (q?.trim()) params.push(`q=${encodeURIComponent(q.trim())}`);
  const query = params.length ? `?${params.join('&')}` : '';

  try {
    const raw = await getJson(`/api/products${query}`);
    // TRẠM KIỂM SOÁT ZOD: dữ liệu từ Server "nhà mình" cũng phải được kiểm tra
    const result = ProductListSchema.safeParse(raw);
    if (!result.success) {
      throw new CatalogError('invalid_data', 'Dữ liệu sản phẩm từ Server không hợp lệ (Zod)');
    }
    return result.data;
  } catch (error) {
    monitoring.recordError(error, 'ProductFetchFailed');
    throw error;
  }
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const raw = await getJson(`/api/products/${encodeURIComponent(id)}`);
  const result = ProductSchema.safeParse(raw);
  if (!result.success) {
    throw new CatalogError('invalid_data', 'Dữ liệu chi tiết sản phẩm không hợp lệ (Zod)');
  }
  return result.data;
};

export const fetchCategories = async (): Promise<CategoryInfo[]> => {
  const result = CategoryListSchema.safeParse(await getJson('/api/products/categories'));
  if (!result.success) {
    throw new CatalogError('invalid_data', 'Danh mục không hợp lệ (Zod)');
  }
  return result.data;
};

export const pingServer = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
};
