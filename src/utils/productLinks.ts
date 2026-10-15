/**
 * Trợ lý AI được dặn ghi mã sản phẩm dạng (prod_18) trong câu trả lời.
 * Tách các mã đó ra (không trùng, tối đa 3) để màn Chat hiện nút "Xem prod_18 →".
 */
export const extractProductIds = (text: string, limit = 3): string[] =>
  [...new Set(text.match(/\bprod_\d+\b/g) ?? [])].slice(0, limit);
