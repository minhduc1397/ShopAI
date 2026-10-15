// Một nguồn duy nhất để hiển thị tiền VND — trước đây mỗi màn hình tự viết lại Intl.NumberFormat.
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

/** 1890000 -> "1.890.000 ₫". Giá trị không hợp lệ hiển thị 0 ₫ thay vì "NaN ₫". */
export const formatCurrency = (value: number): string =>
  vndFormatter.format(Number.isFinite(value) ? Math.round(value) : 0);

/** 1890000 -> "1,9tr" — dùng cho chỗ chật như thẻ thống kê. */
export const formatCompactVnd = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0đ';
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10;
    return `${String(millions).replace('.', ',')}tr`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}đ`;
};
