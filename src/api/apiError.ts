// Đọc thông báo lỗi tiếng Việt mà NestJS trả về trong body (ValidationPipe trả MẢNG message)
export const apiErrorMessage = (error: unknown, fallback = 'Có lỗi xảy ra, thử lại nhé'): string => {
  const err = error as {
    response?: { data?: { message?: unknown } };
    message?: string;
    code?: string;
  };
  const serverMessage = err?.response?.data?.message;
  if (Array.isArray(serverMessage)) return serverMessage.join(', ');
  if (typeof serverMessage === 'string' && serverMessage) return serverMessage;
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Không kết nối được Server ShopAI. Kiểm tra backend đã chạy chưa.';
  }
  return fallback;
};
