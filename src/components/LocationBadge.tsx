import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import {
  DEFAULT_SHIPPING_FEE,
  WAREHOUSE_COORDS,
  getDistanceKm,
  getShippingTier,
} from '@constants/shipping';
import { COLORS, SIZES } from '@constants/theme';

const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const LocationBadge = () => {
  const { coords, loading, error, refresh } = useCurrentLocation();

  // --- Trạng thái 1: Đang dò GPS ---
  if (loading) {
    return (
      <View style={styles.badge}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.textMuted}>  Đang xác định vị trí của bạn...</Text>
      </View>
    );
  }

  // --- Trạng thái 2: Lỗi / bị từ chối -> KHÔNG làm sập màn hình, chỉ hạ cấp trải nghiệm ---
  if (error || !coords) {
    return (
      <Pressable style={styles.badge} onPress={refresh}>
        <Text style={styles.textMuted}>
          📍 {error ?? 'Chưa rõ vị trí'} — tạm tính phí ship {formatVnd(DEFAULT_SHIPPING_FEE)}
        </Text>
        <Text style={styles.retry}>Thử lại</Text>
      </Pressable>
    );
  }

  // --- Trạng thái 3: Thành công -> tính khoảng cách và tra bảng giá ---
  const distanceKm = getDistanceKm(
    coords.latitude,
    coords.longitude,
    WAREHOUSE_COORDS.latitude,
    WAREHOUSE_COORDS.longitude,
  );
  const tier = getShippingTier(distanceKm);

  return (
    <Pressable style={[styles.badge, styles.badgeSuccess]} onPress={refresh}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          📍 Cách kho {distanceKm.toFixed(1)} km · Ship {formatVnd(tier.fee)}
        </Text>
        <Text style={styles.subtitle}>{tier.label}</Text>
        <Text style={styles.coords}>
          ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
        </Text>
      </View>
      <Text style={styles.retry}>Làm mới</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    paddingVertical: 10,
    paddingHorizontal: SIZES.padding,
  },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  title: { fontSize: 13, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#555', marginTop: 2 },
  coords: { fontSize: 11, color: '#888', marginTop: 2 },
  textMuted: { fontSize: 13, color: '#555', flex: 1 },
  retry: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', marginLeft: 8 },
});

export default LocationBadge;