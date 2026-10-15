import { apiErrorMessage } from '../src/api/apiError';

describe('apiErrorMessage — đọc lỗi tiếng Việt từ NestJS', () => {
  it('ValidationPipe trả mảng message → nối bằng dấu phẩy', () => {
    const err = { response: { data: { message: ['Số lượng tối thiểu là 1', 'Giỏ hàng đang trống'] } } };
    expect(apiErrorMessage(err)).toBe('Số lượng tối thiểu là 1, Giỏ hàng đang trống');
  });

  it('message dạng chuỗi (VD 400 gian lận tổng tiền) → giữ nguyên', () => {
    const err = { response: { data: { message: 'Tổng tiền không khớp' } } };
    expect(apiErrorMessage(err)).toBe('Tổng tiền không khớp');
  });

  it('mất mạng → câu hướng dẫn kiểm tra backend', () => {
    expect(apiErrorMessage({ code: 'ERR_NETWORK', message: 'Network Error' })).toMatch(/Không kết nối/);
  });

  it('lỗi lạ → dùng câu dự phòng', () => {
    expect(apiErrorMessage(new Error('boom'), 'Dự phòng')).toBe('Dự phòng');
  });
});
