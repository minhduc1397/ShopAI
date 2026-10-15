// src/constants/geminiConfig.ts
// ============================================================================
// ⚠️⚠️⚠️  CẢNH BÁO BẢO MẬT — CHỈ DÙNG CHO MỤC ĐÍCH HỌC TẬP/LỚP HỌC  ⚠️⚠️⚠️
// ============================================================================
// File này chứa API Key ngay trên Mobile (Client). Bất kỳ ai dịch ngược file
// APK/IPA của bạn bằng Apktool đều đọc được chuỗi Key này chỉ trong vài phút,
// rồi xài ké/đánh sập quota Gemini của bạn.
//
// TUYỆT ĐỐI KHÔNG dùng cách này cho dự án thương mại thật.
// TUYỆT ĐỐI KHÔNG commit file này (điền Key thật) lên Git repository công khai.
//
// -> Ở CHƯƠNG 9, ta sẽ XÓA HẲN file này và mọi Key khỏi Mobile. Toàn bộ logic
//    gọi Gemini AI sẽ chuyển xuống Backend NestJS. Mobile lúc đó chỉ gọi vào
//    API nội bộ của chính chúng ta (`/api/ai/chat`) — không hề biết Key thật.
// ============================================================================
export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
