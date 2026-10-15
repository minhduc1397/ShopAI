# ShopAI — Góc công nghệ (React Native + NestJS)

Đồ án môn **React Native Thực Chiến**: app mua đồ công nghệ có trợ lý AI, đầy đủ 11 chương theo
[bản đồ đề cương](https://thayduy.github.io/react-native-thuc-chien/docs/BAN_DO_DE_CUONG).

| Thư mục | Nội dung |
|---|---|
| `/` | App **React Native 0.86.3** + Expo SDK 57 modules (TypeScript, New Architecture) |
| `shopai-backend/` | API **NestJS 11** + JWT + Prisma/SQLite + proxy Gemini (Chương 9) |
| `.maestro/` | Kịch bản test E2E Maestro (Chương 11) |
| `.github/workflows/ci.yml` | CI: typecheck + lint + Jest (mobile) và lint + unit + e2e (backend) |

---

## ⚡ Chạy nhanh trên laptop thi (Windows + Android Emulator)

Cần sẵn: **Node ≥ 22**, **JDK 17**, **Android Studio** (SDK + 1 máy ảo). Mở 3 cửa sổ terminal tại thư mục repo.

```bash
git clone https://github.com/minhduc1397/ShopAI.git
cd ShopAI
npm install                 # cài app (file .npmrc đã bật legacy-peer-deps, không cần thêm cờ)
npm run backend:install     # cài backend + tự tạo .env + Database SQLite + seed tài khoản demo & 25 sản phẩm
```

> Muốn demo **chat AI**: mở `shopai-backend/.env` (vừa được tự tạo), điền `GEMINI_API_KEY`
> (https://aistudio.google.com/app/apikey — có gói miễn phí) rồi khởi động lại backend. Kiểm tra tại `http://localhost:3000/api/ai/status`.
> **Không commit key lên GitHub** — file `.env` đã bị `.gitignore` chặn; sang laptop thi thì tự gõ lại key.

**Terminal 1 — Backend**
```bash
npm run backend             # http://localhost:3000 — Swagger: http://localhost:3000/api/docs
```

**Terminal 2 — Metro**
```bash
npm start
```

**Terminal 3 — App** (máy ảo đã mở sẵn)
```bash
npm run adb:reverse         # cho máy ảo gọi được localhost:3000 và Metro
npm run android
```

Đăng nhập: **demo@shopai.com / 123456** (hoặc bấm “⚡ Dùng tài khoản demo”, hoặc tự Đăng ký).

> Điện thoại thật qua Wi-Fi (không cắm cáp): đổi `development` trong `src/constants/env.ts` thành IP LAN
> của laptop, VD `http://192.168.1.15:3000` (xem bằng `ipconfig`).

---

## 🎬 Kịch bản demo trước hội đồng (< 10 phút)

1. **Đăng ký** tài khoản mới → vào thẳng app (JWT thật, lưu SecureStore).
2. **Khám phá**: chấm xanh “Server online”, tìm “ban phim” (không dấu vẫn ra), lọc danh mục, kéo để làm mới, cuộn để tải thêm (InfiniteQuery).
3. Bấm sản phẩm → **Chi tiết** → **Mua ngay** → sang tab Giỏ (badge số lượng).
4. **Giỏ**: tăng/giảm số lượng (tối đa 10 hoặc theo tồn kho), xóa → **Thanh toán** (Modal).
5. Đặt hàng → mã `ORD-…` **PENDING** → **Xem hóa đơn** → **Thanh toán giả lập** → **PAID**.
6. Tab **Đơn hàng**: lọc Chờ thanh toán / Đã thanh toán. Tắt backend rồi bật lại → đơn **vẫn còn** (Prisma).
7. **Tài khoản**: thống kê đơn + tổng chi tiêu (từ `/api/auth/me`), bật **Giao diện tối**, mở **Demo Redux Toolkit**, xem **Nhật ký giám sát**.
8. **Trợ lý AI ✨**: hỏi “tai nghe chống ồn nào đáng mua?” → AI gợi ý đúng hàng shop đang bán, có nút “Xem prod_18 →” mở sản phẩm.
9. **Quét mã 📷** (máy thật) → rung → mã về Trang chủ, mã dạng `prod_3` có nút “Mở sản phẩm”.
10. Deep link: `adb shell am start -a android.intent.action.VIEW -d "shopai://product/prod_3"`.
11. Đưa app xuống nền > 2 phút → mở lại phải xác thực sinh trắc học (App Lock).
12. Đăng xuất → về Login, không “Back” lén vào được.

---

## 🔧 Lỗi build Android sau Sprint 8–9 đã sửa thế nào

Project tạo bằng **React Native 0.87** (Gradle 9.4.1, AGP 9), nhưng Sprint 8 cài **Expo SDK 57** — bản Expo này
chỉ hỗ trợ **RN 0.86.3**. Hậu quả: plugin Gradle của Expo (Kotlin 2.1.20) không đọc được Kotlin 2.3 trong Gradle 9.4.1,
module `expo` gọi API `setTargetSdk` đã bị xóa ở AGP 9 → `gradlew assembleDebug` thất bại.
Cách sửa: hạ RN về **0.86.3** đúng tổ hợp chính thức của Expo 57 (Gradle 9.3.1, compileSdk 36, Kotlin 2.1.20) và
đồng bộ reanimated / worklets / screens / safe-area / flash-list / async-storage theo `expo/bundledNativeModules.json`.
`reactNativeArchitectures` để `arm64-v8a,x86_64` (máy thật + máy ảo) cho build nhanh.

---

## ✨ Phần tự làm thêm / khác giáo trình

- **Catalog riêng 25 món đồ công nghệ** (`shopai-backend/src/product/product.data.ts`): ảnh được soi từng tấm cho khớp đúng món (bản cũ có Rubik hiện ảnh Bitcoin, dầu bôi trơn hiện vỉ thuốc…), có hãng, danh mục, điểm đánh giá, tồn kho.
- **Tìm kiếm không dấu + lọc danh mục phía Server** (`GET /api/products?q=&category=`, `GET /api/products/categories`).
- **Trợ lý AI biết hàng thật**: Server ghép catalog vào System Prompt → AI chỉ gợi ý món đang bán, đúng giá; app biến mã `prod_xx` trong câu trả lời thành nút mở sản phẩm.
- **Trợ lý AI chịu lỗi tốt**: gọi Gemini REST trực tiếp, timeout 20s, model quá tải / hết hạn mức thì tự chuyển sang model dự phòng (3.5-flash → 3.1-flash-lite → 3.8-flash), câu trả lời bị cắt cụt không bao giờ tới tay khách.
- **Luật giỏ hàng**: tối đa 10 món cùng loại và không vượt tồn kho Server báo.
- **Tab Tài khoản** + `GET /api/auth/me` (số đơn, tổng đã thanh toán), công tắc rung phản hồi.
- **Bộ nhận diện riêng** tím indigo + vàng hổ phách, Dark Mode áp dụng cả header/tab bar và **nhớ lựa chọn**.
- **Hóa đơn kiểu biên lai** có ảnh sản phẩm, badge trạng thái, giá snapshot.
- **Sửa lỗi**: đăng xuất giờ xóa cache React Query (trước đó user sau thấy đơn của user trước); tab Đơn hàng không còn trộn đơn lưu cục bộ; Home không còn âm thầm hiện dữ liệu giả khi Server tắt — hiện đúng lỗi *mất kết nối* / *dữ liệu không hợp lệ (Zod)* kèm nút Thử lại.

---

## ✅ Đối chiếu checklist `SHOPAI_HOAN_THIEN`

| Mục | Ở đâu trong code |
|---|---|
| Auth Login/Register JWT thật, SecureStore, App Lock | `LoginScreen`, `RegisterScreen`, `useAuthStore`, `useAppLock`, `BiometricGateScreen` · Nest `src/auth/` |
| Home: Nest + InfiniteQuery + Zod + phân biệt lỗi + refresh | `HomeScreen`, `services/catalogApi.ts`, `types/product.schema.ts` |
| Detail theo `productId` + Deep Link | `ProductDetailScreen`, `linking` trong `App.tsx`, `AndroidManifest.xml` |
| Giỏ Zustand persist + badge | `store/useCartStore.ts`, `MainTabNavigator` |
| Checkout `useMutation` + Bearer → PENDING; chỉ xóa giỏ khi thành công | `CheckoutScreen`, `api/axiosClient.ts` |
| Orders list/detail/pay → PAID; 401 khi thiếu token; Server tự tính tiền | `OrdersScreen`, `OrderDetailScreen` · Nest `src/order/` |
| Prisma + SQLite, restart không mất đơn | `shopai-backend/prisma/` |
| AI proxy Gemini, không còn key/SDK AI trong app | Nest `src/ai/` · app chỉ còn `services/aiChatService.ts` gọi `/api/ai/chat` |
| Swagger, ValidationPipe, Helmet, Rate limit, `.env.example` | `shopai-backend/src/main.ts`, `app.module.ts` |
| Dark Mode, Design System, Button variants | `contexts/ThemeContext.tsx`, `components/ui/ShopButton.tsx` |
| FlashList + Reanimated + SafeArea | `HomeScreen` (FadeInDown) |
| Camera scan + haptic + GPS ship | `ScannerScreen`, `utils/haptics.ts`, `LocationBadge` |
| Redux Toolkit (đề cương 5.2) | `store/redux/`, `ReduxCartDemoScreen` (Tài khoản → Demo Redux Toolkit) |
| Giám sát lỗi (Ch.10): breadcrumb, non-fatal, test crash ẩn ở Dev | `services/monitoring.ts`, `AppErrorBoundary`, giữ 2s dòng phiên bản cuối Home |
| `env.ts`, `eas.json`, ký Release | `src/constants/env.ts`, `eas.json`, `android/app/build.gradle` |
| Jest + RNTL + coverage ≥ 80% | `__tests__/` (29 test, `npm run test:coverage`) |
| Nest unit (AuthService mock Prisma) + Supertest | `shopai-backend/src/**/*.spec.ts`, `shopai-backend/test/auth-orders.e2e-spec.ts` (26 test) |
| Maestro `login_home`, `cart_checkout` | `.maestro/` |
| CI GitHub Actions | `.github/workflows/ci.yml` |

---

## 🧪 Kiểm thử

```bash
npm run typecheck && npm run lint && npm test           # Mobile
cd shopai-backend && npm test && npm run test:e2e        # Backend (e2e dùng prisma/test.db riêng)
maestro test .maestro/                                   # E2E trên máy ảo (backend + app đang chạy)
```

---

## 🔌 Phần cần tài khoản riêng (Chương 10)

Code đã chừa sẵn chỗ cắm; các bước dưới **không bắt buộc để app chạy**.

**Firebase Crashlytics**
1. Tạo project Firebase, tải `google-services.json` vào `android/app/`.
2. `npm install @react-native-firebase/app @react-native-firebase/crashlytics`, thêm 2 plugin Gradle
   (`com.google.gms.google-services`, `com.google.firebase.firebase-crashlytics`) như giáo trình Bước 1.
3. Trong `index.js` thêm:
   ```js
   import crashlytics from '@react-native-firebase/crashlytics';
   import { setCrashReporter } from './src/services/monitoring';
   setCrashReporter({
     log: (m) => crashlytics().log(m),
     recordError: (e, n) => crashlytics().recordError(e, n),
     setAttributes: (a) => crashlytics().setAttributes(a),
     setUserId: (id) => crashlytics().setUserId(id),
     crash: () => crashlytics().crash(),
   });
   ```
   Mọi màn hình đang gọi `monitoring.*` sẽ tự gửi về Firebase — không phải sửa thêm.

**EAS Update / EAS Build**: `npm i -g eas-cli` → `eas login` → `eas init` → `npx expo install expo-updates`
→ `eas update --branch preview`. Profile `development / preview / production` có sẵn trong `eas.json`.

**Build Release đã ký (AAB nộp Store + APK cài thử)** — minh chứng mục D
1. Tạo keystore (một lần, **nhớ sao lưu** file + mật khẩu):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore android/app/shopai-release.keystore -alias shopai-release -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `android/keystore.properties.example` → `android/keystore.properties`, điền mật khẩu (file này bị git chặn).
3. Build:
   ```bash
   cd android && gradlew.bat bundleRelease assembleRelease
   ```
   → `android/app/build/outputs/bundle/release/app-release.aab` và `.../apk/release/app-release.apk`.
   Chưa có `keystore.properties` thì bản Release tự ký bằng khóa debug để vẫn cài thử được.
4. Cài thử: `adb install -r android/app/build/outputs/apk/release/app-release.apk` → `npm run adb:reverse` → mở app
   (không cần Metro). Bản Release chỉ cho HTTP tới `localhost/127.0.0.1/10.0.2.2`; demo qua Wi-Fi bằng IP LAN thì thêm IP
   vào `android/app/src/release/res/xml/network_security_config.xml`.

> Windows giới hạn đường dẫn 260 ký tự — `android/build.gradle` + `android/app/build.gradle` đã dời thư mục build C++
> sang `%TEMP%\shopai-cxx` nên clone ở thư mục sâu vẫn build được bản arm64.

Đối chiếu đầy đủ checklist + biên bản + trả lời đề cương: xem **[NGHIEM_THU.md](NGHIEM_THU.md)**.

---

## 🧯 Gỡ lỗi nhanh

| Triệu chứng | Cách xử lý |
|---|---|
| Home báo “Mất kết nối tới Server” / chấm đỏ | Backend chưa chạy, hoặc quên `npm run adb:reverse` (chạy lại mỗi lần khởi động máy ảo) |
| Chat AI báo “chưa cấu hình GEMINI_API_KEY” | Điền `GEMINI_API_KEY` trong `shopai-backend/.env` rồi khởi động lại backend |
| Chat AI báo “quá tải ở mọi model” | Key hết hạn mức trong ngày hoặc Google đang quá tải — đợi vài phút / đổi key |
| Đăng nhập demo báo sai mật khẩu | `cd shopai-backend && npx prisma db seed` |
| Bản Release báo “Đăng nhập thất bại” | Quên `npm run adb:reverse`, hoặc đang dùng IP LAN chưa khai báo trong `network_security_config.xml` |
| `npm install` báo ERESOLVE | Đảm bảo file `.npmrc` có mặt (repo đã kèm) |
| Build lỗi `ninja: manifest 'build.ninja' still dirty` / `Stat(...)` | Đường dẫn quá dài — xóa `%TEMP%\shopai-cxx` và `android/app/.cxx` rồi build lại; hoặc clone vào thư mục ngắn như `C:\ShopAI` |
| Build báo thiếu SDK 36 | Android Studio → SDK Manager → cài *Android 16 (API 36)* + *Build-Tools 36.0.0* |
| Màn hình đỏ “Unable to load script” | Metro chưa chạy (`npm start`) hoặc thiếu `adb reverse tcp:8081 tcp:8081` |
