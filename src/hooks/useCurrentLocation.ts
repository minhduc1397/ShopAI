import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type Coords = { latitude: number; longitude: number };

type LocationState = {
  coords: Coords | null;
  loading: boolean;
  error: string | null;
};

/**
 * Xin quyền vị trí.
 * - Android: phải tự gọi PermissionsAndroid (thư viện này không tự xin).
 * - iOS: thư viện tự bung Pop-up dựa trên Info.plist, nên ta chỉ cần trả về true.
 */
const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization(); // Đọc NSLocationWhenInUseUsageDescription trong Info.plist
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'ShopAI cần quyền vị trí',
      message: 'Cho phép ShopAI biết vị trí để tính chính xác phí giao hàng tới nhà bạn.',
      buttonPositive: 'Cho phép',
      buttonNegative: 'Để sau',
    },
  );

  // PermissionsAndroid trả về 3 giá trị: 'granted' | 'denied' | 'never_ask_again'
  if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Quyền vị trí đã bị chặn',
      'Bạn đã chọn "Không hỏi lại". Hãy vào Cài đặt > ShopAI > Quyền > Vị trí để bật lại.',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const useCurrentLocation = () => {
  const [state, setState] = useState<LocationState>({
    coords: null,
    loading: true,
    error: null,
  });

  const fetchLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const ok = await requestLocationPermission();
    if (!ok) {
      setState({ coords: null, loading: false, error: 'Chưa được cấp quyền vị trí' });
      return;
    }

    // Bọc API callback cũ thành Promise-style bằng cách setState trực tiếp trong callback
    Geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          loading: false,
          error: null,
        });
      },
      (err) => {
        // err.code: 1 = từ chối quyền, 2 = không bắt được tín hiệu, 3 = quá thời gian chờ
        const messages: Record<number, string> = {
          1: 'Bạn đã từ chối quyền vị trí',
          2: 'Không bắt được tín hiệu GPS',
          3: 'Quá thời gian chờ GPS (thử ra ngoài trời)',
        };
        setState({
          coords: null,
          loading: false,
          error: messages[err.code] ?? 'Không lấy được vị trí',
        });
      },
      {
        enableHighAccuracy: false, // false = ưu tiên Wi-Fi/trạm phát sóng, nhanh & tiết kiệm pin.
                                   // Tính phí ship chỉ cần chính xác vài trăm mét là quá đủ.
        timeout: 15000,            // BẮT BUỘC có timeout, nếu không app treo vô hạn (Phần 7.7)
        maximumAge: 60000,         // Chấp nhận toạ độ đã cache trong 60 giây gần nhất
      },
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { ...state, refresh: fetchLocation };
};