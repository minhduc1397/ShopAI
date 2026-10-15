import { formatCompactVnd, formatCurrency } from '../src/utils/formatCurrency';

// Intl có thể chèn khoảng trắng không ngắt (NBSP) trước ₫ — chuẩn hóa để so sánh
const clean = (s: string) => s.replace(/\s/g, ' ');

describe('formatCurrency', () => {
  it('định dạng tiền VND có dấu chấm ngăn cách hàng nghìn', () => {
    expect(clean(formatCurrency(1890000))).toBe('1.890.000 ₫');
  });

  it('làm tròn số lẻ — tiền VND không có phần thập phân', () => {
    expect(clean(formatCurrency(999.6))).toBe('1.000 ₫');
  });

  it('giá trị không hợp lệ hiển thị 0 ₫ thay vì "NaN ₫"', () => {
    expect(clean(formatCurrency(Number.NaN))).toBe('0 ₫');
    expect(clean(formatCurrency(Infinity))).toBe('0 ₫');
  });
});

describe('formatCompactVnd', () => {
  it.each([
    [32990000, '33tr'],
    [1890000, '1,9tr'],
    [450000, '450k'],
    [900, '900đ'],
    [0, '0đ'],
  ])('%d → %s', (input, expected) => {
    expect(formatCompactVnd(input)).toBe(expected);
  });
});
