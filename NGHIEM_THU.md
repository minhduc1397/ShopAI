# Biên bản nghiệm thu ShopAI — đối chiếu `SHOPAI_HOAN_THIEN.md`

> Tài liệu chấm: https://thayduy.github.io/react-native-thuc-chien/docs/SHOPAI_HOAN_THIEN
> Ký hiệu: ✅ đạt & đã kiểm chứng · 🟡 đạt phần code, cần thao tác/tài khoản riêng khi demo · 📝 có biên bản hoãn (mục cuối)

**Phiên bản:** ShopAI v1.1.0 (versionCode 2) · React Native 0.86.3 + Expo SDK 57 modules · NestJS 11 + Prisma/SQLite

---

## 📦 File nộp kèm (minh chứng build Release — mục D)

| File | Ý nghĩa |
|---|---|
| `nop-bai/ShopAI-v1.1.0-release.aab` | Android App Bundle đã ký — định dạng nộp Google Play (`./gradlew bundleRelease`) |
| `nop-bai/ShopAI-v1.1.0-release.apk` | APK Release đã ký — cài thẳng lên máy thật/máy ảo để demo (`./gradlew assembleRelease`) |

- Ký bằng keystore riêng `shopai-release.keystore` (alias `shopai-release`, RSA 2048, hạn 10.000 ngày) —
  chứng chỉ `CN=DANG MINH DUC, OU=ShopAI, O=ShopAI, L=Ho Chi Minh, C=VN`,
  SHA-256 `25b3f3fb206ca23d242b44e0db7afd2383223f08b5baadb2006e0e4f0a6d88fe` (`apksigner verify --print-certs`).
- Keystore + mật khẩu (`android/keystore.properties`) **không commit**; mẫu ở `android/keystore.properties.example`.
- Gói đủ 2 kiến trúc `arm64-v8a` (điện thoại thật) + `x86_64` (máy ảo).
- Đã cài bản Release lên máy ảo Pixel 9 Pro XL: đăng nhập JWT, tải 25 sản phẩm từ Nest, “Server online” — **không cần Metro**.

### Biên bản bảo mật — không có API Key trong APK (mức “Xuất sắc”)
- Quét `assets/index.android.bundle` trong APK tìm chuỗi key Gemini / `GEMINI_API_KEY=` → **0 kết quả**.
- App không còn SDK AI; chỉ gọi `POST /api/ai/chat` của Nest. Key nằm duy nhất trong `shopai-backend/.env` (bị `.gitignore` chặn).
- Bản Release chỉ cho phép HTTP tới `localhost / 127.0.0.1 / 10.0.2.2` (`android/app/src/release/res/xml/network_security_config.xml`), mọi domain khác bắt buộc HTTPS.

---

## A. Chạy được

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| Android Emulator chạy ShopAI | ✅ | Debug + Release chạy trên Pixel 9 Pro XL (API 36) |
| Backend chạy `0.0.0.0:3000`, Mobile gọi qua `API_BASE_URL` (`env.ts`) | ✅ | `shopai-backend/src/main.ts`, `src/constants/env.ts`, chấm “Server online” |
| Máy thật: Camera Sprint 7 | 🟡 📝 | Code `ScannerScreen` có sẵn; máy ảo không có camera → demo trên điện thoại thật |

## B. Hành trình sản phẩm

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| Login / Logout / Register — AuthStack ↔ Main an toàn | ✅ | `App.tsx` (conditional navigator), tab Tài khoản → Đăng xuất |
| Login `POST /api/auth/login`, Register `POST /api/auth/register` thật | ✅ | `LoginScreen`, `RegisterScreen`; e2e Supertest |
| Token SecureStore — mở lại app vẫn vào Main | ✅ | `useAuthStore` (`expo-secure-store`) |
| App Lock: vào nền > 2 phút phải xác thực lại | ✅ | `useAppLock`, `BiometricGateScreen` |
| Home: Nest + `useInfiniteQuery` + Zod + phân biệt lỗi mạng / Zod | ✅ | `HomeScreen`, `services/catalogApi.ts` (`CatalogError.kind`) |
| Pull-to-refresh Home | ✅ | `onRefresh` của FlashList |
| Detail theo `productId` + Deep Link | ✅ | `shopai://product/prod_3` (`App.tsx` linking + `AndroidManifest`) |
| Giỏ thêm/xóa/tổng tiền, persist sau kill app | ✅ | `useCartStore` (Zustand persist) + 6 unit test |
| Tab Giỏ có icon + badge | ✅ | `MainTabNavigator` |
| Checkout `useMutation` + Bearer → `PENDING` + `orderId`, chỉ xóa giỏ khi thành công | ✅ | `CheckoutScreen` |
| Tab Đơn hàng từ Nest, Chi tiết hóa đơn, Pay → `PAID` | ✅ | `OrdersScreen`, `OrderDetailScreen` |
| Restart Nest: đơn vẫn còn | ✅ | Prisma + SQLite, đã kiểm thử restart |
| Orders không Token → `401` | ✅ | `JwtAuthGuard`; e2e Supertest |
| Dark Mode | ✅ | `ThemeContext` (lưu lựa chọn), tab Tài khoản → Giao diện tối |
| Deep Link native + JS | ✅ | `adb shell am start -a android.intent.action.VIEW -d "shopai://product/prod_3"` |

## C. AI & Native

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| Scanner: quyền chuẩn, chống quét lặp, haptic | 🟡 📝 | `ScannerScreen`, `utils/haptics.ts` (test 100%) — cần máy thật |
| LocationBadge ước tính ship | ✅ | `LocationBadge` + `constants/shipping.ts` |
| AI Chat: history + typing + Thử lại + gợi ý; gọi Nest `/api/ai/chat` | ✅ | `AIChatScreen`; AI gợi ý đúng hàng shop + nút “Xem prod_xx →” |
| Không còn Gemini Key trong bundle Mobile | ✅ | Biên bản bảo mật ở trên |

## D. Chất lượng nghề

| Mục | Trạng thái | Bằng chứng |
|---|---|---|
| Jest: `formatCurrency` + `useCartStore` | ✅ | `__tests__/` — **29 test**, coverage **98.7%** (ngưỡng 80%) |
| RNTL: `ShopButton` | ✅ | `__tests__/ShopButton.test.tsx` (onPress, disabled, loading) |
| Maestro `login_home`, `cart_checkout` | 🟡 📝 | `.maestro/*.yaml` đã viết theo testID thật; cần cài Maestro CLI để chạy |
| Nest Unit `AuthService` (mock Prisma) | ✅ | `src/auth/auth.service.spec.ts` (+ `OrderService`, `ProductService`) — **16 test** |
| Nest Supertest login + register + orders 401/201 + pay | ✅ | `test/auth-orders.e2e-spec.ts` — **10 test**, DB riêng `test.db` |
| CI GitHub Actions: lint + test Mobile + `backend-test` | ✅ | `.github/workflows/ci.yml` (matrix Node 22/24, cache, artifact coverage) |
| Crashlytics nhận test crash + non-fatal | 🟡 📝 | `services/monitoring.ts` (breadcrumb, `recordError('CheckoutOrderFailed')`, test crash ẩn ở `__DEV__`) — cần tài khoản Firebase |
| `eas.json` đủ profile; ≥1 minh chứng build Release | ✅ | `eas.json` (development/preview/production) + file `.aab` ở trên |

## E. Đề cương (nộp kèm đồ án)

| Mục | Trạng thái | Ở đâu |
|---|---|---|
| `src/store/redux/` RTK demo chạy được | ✅ | Tab Tài khoản → “Demo Redux Toolkit” |
| Giải thích Context vs RTK vs Zustand | ✅ | Phần trả lời bên dưới |
| Giải thích Drawer vs Tab; Deep Link vs navigate | ✅ | Phần trả lời bên dưới |

### Trả lời đề cương (học thuộc để trả lời miệng)

**Context API vs Redux Toolkit vs Zustand — vì sao ShopAI chọn Zustand?**
- *Context*: có sẵn trong React, hợp với dữ liệu ít thay đổi (Theme Sáng/Tối của ShopAI). Nhược điểm: mỗi lần value đổi, **mọi** component dùng Context đều render lại → không hợp cho giỏ hàng đổi liên tục.
- *Redux Toolkit*: store tập trung, `createSlice` gộp action + reducer, DevTools mạnh, hợp dự án lớn nhiều người. Nhược điểm: nhiều boilerplate (Provider, slice, dispatch, selector).
- *Zustand*: store là một hook, chọn đúng phần state cần (`useCartStore(s => s.items)`) nên chỉ component liên quan render lại, có sẵn `persist` để lưu giỏ xuống AsyncStorage. ShopAI chọn Zustand cho Auth + Giỏ vì ít code nhất mà vẫn tối ưu render; RTK vẫn có bản demo `src/store/redux/` để đạt đề cương 5.2.
- *Server State* (sản phẩm, đơn hàng) **không** để trong 3 thứ trên mà dùng TanStack Query (cache, refetch, pagination).

**Drawer vs Tab Navigator**
- *Tab*: vài màn hình chính ngang hàng, chuyển một chạm, luôn hiển thị (ShopAI: Khám phá / Giỏ hàng / Đơn hàng / Tài khoản, có badge số lượng giỏ).
- *Drawer*: menu kéo từ cạnh màn hình, chứa nhiều mục ít dùng (cài đặt, trợ giúp…); không luôn hiển thị nên không hợp cho luồng mua hàng cần thao tác nhanh.

**Deep Link vs `navigation.navigate`**
- `navigate('ProductDetail', { productId })`: điều hướng **bên trong** app khi app đang chạy, tham số truyền bằng object JS.
- Deep Link `shopai://product/prod_3`: hệ điều hành mở app **từ bên ngoài** (link, QR, thông báo); `linking` config trong `App.tsx` dịch URL thành đúng cây màn hình MainTabs → HomeTab → ProductDetail với `productId` lấy từ URL. Cần khai báo `intent-filter` scheme `shopai` trong `AndroidManifest.xml`.

---

## 📝 Biên bản hoãn — các mục cần tài khoản / thiết bị riêng

| Mục | Lý do chưa demo trên máy phát triển | Đã chuẩn bị sẵn | Cách hoàn tất |
|---|---|---|---|
| Camera / Scanner (Ch.7) | Máy ảo không có camera thật | `ScannerScreen` (Vision Camera + Code Scanner, chống quét lặp, haptic) | Cài `ShopAI-v1.1.0-release.apk` lên điện thoại Android, cắm USB + `npm run adb:reverse`, quét mã `prod_3` |
| Firebase Crashlytics (Ch.10) | Cần dự án Firebase + `google-services.json` của chủ tài khoản | `monitoring.ts` có `setCrashReporter` — cắm Crashlytics không sửa màn hình nào; nhật ký sự kiện xem được ở tab Tài khoản | Làm theo mục “Firebase Crashlytics” trong `README.md` |
| EAS Update / EAS Build (Ch.10) | Cần tài khoản Expo | `eas.json` đủ 3 profile | `eas login` → `eas init` → `eas build -p android --profile preview` |
| Maestro E2E (Ch.11) | Chưa cài Maestro CLI trên máy phát triển | `.maestro/login_home.yaml`, `.maestro/cart_checkout.yaml` dùng testID thật (`login-email`, `add-prod_1`, `confirm-order`, `pay-order`…) | Cài Maestro CLI → bật backend + app debug → `npm run e2e` |
| iOS (Ch.10 phần E) | Không có máy Mac | — | Quy trình Archive → TestFlight trình bày bằng lời |
