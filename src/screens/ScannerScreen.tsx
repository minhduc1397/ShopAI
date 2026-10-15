import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import ShopButton from '@components/ui/ShopButton';
import { COLORS } from '@constants/theme';
import { hapticSuccess } from '@utils/haptics';

type PermissionState = 'checking' | 'granted' | 'denied';

const ScannerScreen = ({ navigation }: any) => {
  const [permission, setPermission] = useState<PermissionState>('checking');
  const device = useCameraDevice('back');
  const isFocused = useIsFocused();

  // Khóa chống quét lặp
  const isScanning = useRef(false);

  // 1. Kiểm tra và yêu cầu quyền truy cập Camera
  const requestPermission = useCallback(async () => {
    const current = Camera.getCameraPermissionStatus();
    if (current === 'granted') {
      setPermission('granted');
      return;
    }

    const status = await Camera.requestCameraPermission();
    setPermission(status === 'granted' ? 'granted' : 'denied');
  }, []);

  // 2. Yêu cầu quyền lúc màn hình được mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // 3. Kiểm tra lại quyền khi người dùng quay lại ứng dụng từ Cài đặt
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') requestPermission();
    });
    return () => sub.remove();
  }, [requestPermission]);

  // 4. Hướng dẫn mở Cài đặt nếu quyền bị từ chối
  const openAppSettings = () => {
    Alert.alert(
      'Cần quyền Camera',
      'Bạn đã từ chối quyền Camera nên ShopAI không thể quét mã vạch. Hãy vào Cài đặt > ShopAI và bật lại quyền Camera nhé.',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
      ],
    );
  };

  // 5. Logic xử lý quét mã
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128'],
    onCodeScanned: (codes) => {
      if (isScanning.current) return;
      if (codes.length === 0) return;

      const value = codes[0].value;
      if (!value) return;

      isScanning.current = true;
      console.log('Phát hiện mã:', value);

      hapticSuccess();

      // Kiểm tra mã quét: nếu khớp mã sản phẩm thì vào chi tiết, ngược lại trả về Home
      if (value.startsWith('backend_prod_')) {
        navigation.navigate('ProductDetail', { productId: value });
      } else {
        navigation.navigate('Home', { scannedCode: value });
      }
    },
  });

  // ---------- Giao diện theo trạng thái ----------

  // Đang kiểm tra quyền
  if (permission === 'checking') {
    return (
      <View style={styles.center}>
        <Text style={styles.stateText}>Đang kiểm tra quyền Camera...</Text>
      </View>
    );
  }

  // Bị từ chối quyền
  if (permission === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.deniedTitle}>Chưa có quyền Camera</Text>
        <Text style={styles.deniedDesc}>
          ShopAI cần Camera để quét mã vạch sản phẩm. Ảnh chỉ được xử lý ngay trên máy của bạn và không bao
          giờ được gửi đi đâu cả.
        </Text>
        <ShopButton title="Mở Cài đặt" onPress={openAppSettings} style={{ width: 200, marginBottom: 12 }} />
        <ShopButton
          title="Quay lại"
          onPress={() => navigation.goBack()}
          style={{ width: 200, backgroundColor: COLORS.secondary }}
        />
      </View>
    );
  }

  // Thiết bị không có camera sau
  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.stateText}>Thiết bị không có Camera sau!</Text>
        <Text style={styles.deniedDesc}>
          Bạn có đang chạy trên máy ảo (Simulator/Emulator) không? Camera bắt buộc phải chạy trên điện thoại
          thật.
        </Text>
        <ShopButton title="Quay lại" onPress={() => navigation.goBack()} style={{ width: 200 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        codeScanner={codeScanner}
      />

      {/* Khung ngắm */}
      <View style={styles.frameWrapper} pointerEvents="none">
        <View style={styles.frame} />
      </View>

      {/* Nút hủy bỏ và hướng dẫn */}
      <View style={styles.overlay}>
        <Text style={styles.instruction}>Đưa mã vạch vào khung hình</Text>
        <ShopButton
          title="Hủy bỏ"
          onPress={() => navigation.goBack()}
          style={{ width: 150, backgroundColor: COLORS.error }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  stateText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.error,
  },
  deniedDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  frameWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
});

export default ScannerScreen;
