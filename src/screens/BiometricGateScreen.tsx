import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import ShopButton from '@components/ui/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';

type Props = {
  /** Gọi khi user đã vượt qua cổng (hoặc máy không hỗ trợ sinh trắc học). */
  onUnlock: () => void;
};

const BiometricGateScreen = ({ onUnlock }: Props) => {
  const [checking, setChecking] = useState(true);
  const [failed, setFailed] = useState(false);
  const [label, setLabel] = useState('sinh trắc học'); // Sẽ đổi thành "Face ID" hoặc "vân tay"
  const logout = useAuthStore((state) => state.logout);

  const authenticate = useCallback(async () => {
    setChecking(true);
    setFailed(false);

    try {
      // 1. Máy có cảm biến không?
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      // 2. User đã đăng ký khuôn mặt/vân tay trong Cài đặt máy chưa?
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('[BiometricGateScreen] check:', { hasHardware, isEnrolled });

      // Thiếu một trong hai -> KHÔNG chặn user, cho vào luôn.
      // Chặn ở đây là lỗi UX nghiêm trọng: máy Android giá rẻ sẽ không bao giờ vào được app.
      if (!hasHardware || !isEnrolled) {
        console.log('[BiometricGateScreen] Bỏ qua xác thực do máy không có cảm biến hoặc chưa cài');
        onUnlock();
        return;
      }

      // 3. Hiển thị đúng tên loại sinh trắc học để câu chữ thân thiện hơn
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setLabel('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setLabel('vân tay');
      }

      // 4. Bung giao diện quét của HỆ ĐIỀU HÀNH (app không hề nhìn thấy khuôn mặt bạn — Phần 8.7)
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để mở ShopAI',
        cancelLabel: 'Huỷ',
        // false = vẫn cho user nhập mã PIN của máy nếu quét mặt/vân tay hỏng.
        // ĐỪNG đặt true, nếu không user đeo khẩu trang sẽ bị khoá ngoài tài khoản của chính họ.
        disableDeviceFallback: false,
      });

      if (result.success) {
        onUnlock();
      } else {
        setFailed(true); // user_cancel, lockout, user_fallback...
      }
    } catch (e) {
      // Lỗi bất ngờ từ tầng Native -> vẫn cho user một lối thoát, không treo app
      console.log('[biometric] Lỗi xác thực:', e);
      setFailed(true);
    } finally {
      setChecking(false);
    }
  }, [onUnlock]);

  // Tự động bung Pop-up quét ngay khi màn hình vừa hiện lên
  useEffect(() => {
    authenticate();
  }, [authenticate]);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.hint}>Đang xác thực...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>ShopAI đang khoá</Text>
      <Text style={styles.hint}>
        {failed
          ? `Xác thực ${label} chưa thành công. Bạn có thể thử lại hoặc đăng nhập lại bằng mật khẩu.`
          : `Hãy xác thực bằng ${label} để tiếp tục.`}
      </Text>

      <ShopButton title="Thử lại" onPress={authenticate} style={{ width: 220, marginBottom: 12 }} />

      {/* LỐI THOÁT BẮT BUỘC: user luôn phải quay về được màn hình Login bằng mật khẩu */}
      <ShopButton
        title="Đăng nhập bằng mật khẩu"
        onPress={logout}
        style={{ width: 220, backgroundColor: COLORS.secondary }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.background,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: SIZES.h2, fontWeight: 'bold', marginBottom: 8, color: COLORS.text },
  hint: { fontSize: 14, textAlign: 'center', color: '#555', marginTop: 8, marginBottom: 28, lineHeight: 20 },
});

export default BiometricGateScreen;
