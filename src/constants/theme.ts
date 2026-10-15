// src/constants/theme.ts
// Bộ nhận diện riêng của ShopAI: tím indigo "công nghệ" + điểm nhấn vàng hổ phách
// (thay cho tông đỏ mặc định của giáo trình).
export const COLORS = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primarySoft: '#EEF2FF',
  secondary: '#0EA5E9',
  accent: '#F59E0B',
  background: '#F4F5FB',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  text: '#111827',
  textLight: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 14,
  padding: 16,
  h1: 24,
  h2: 20,
  h3: 18,
  body1: 16,
  body2: 14,
  small: 12,
};

/** Map variant chữ → fontSize / fontWeight (dùng cho Typography) */
export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: '700' as const },
  h2: { fontSize: SIZES.h2, fontWeight: '700' as const },
  h3: { fontSize: SIZES.h3, fontWeight: '600' as const },
  body1: { fontSize: SIZES.body1, fontWeight: '400' as const },
  body2: { fontSize: SIZES.body2, fontWeight: '400' as const },
  small: { fontSize: SIZES.small, fontWeight: '400' as const },
};

/** Màu trạng thái đơn hàng — dùng chung cho tab Đơn hàng và Chi tiết hóa đơn */
export const ORDER_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: '#B45309', bg: '#FEF3C7' },
  PAID: { label: 'Đã thanh toán', color: '#15803D', bg: '#DCFCE7' },
};
