// src/screens/CheckoutScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ui/ShopButton';
import { CartItem, useCartStore } from '@store/useCartStore';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { formatCurrency } from '@utils/formatCurrency';
import { hapticError, hapticSuccess } from '@utils/haptics';
import { monitoring } from '@services/monitoring';
import { apiErrorMessage } from '@api/apiError';
import axiosClient from '@api/axiosClient';

type CreateOrderResponse = { id: string; status: string; total: number; createdAt: string };

const placeOrderAPI = async (items: CartItem[], total: number): Promise<CreateOrderResponse> => {
  // Chỉ gửi productId + quantity — KHÔNG gửi giá. Server tự tra giá thật (Phần 9.12).
  // Bearer Token do Interceptor của axiosClient tự gắn.
  const response = await axiosClient.post<CreateOrderResponse>('/api/orders', {
    items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
    total,
  });
  return response.data;
};

const CheckoutScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { mutate, isPending, isError, error, isSuccess, data } = useMutation({
    mutationFn: () => {
      // Breadcrumb + Custom Keys TRƯỚC việc nguy hiểm nhất của app: đụng tới tiền (Chương 10)
      monitoring.log(`Checkout: bắt đầu đặt ${items.length} loại sản phẩm`);
      monitoring.setAttributes({
        screen: 'CheckoutScreen',
        cart_item_count: String(items.length),
        cart_total: String(totalPrice),
      });
      return placeOrderAPI(items, totalPrice);
    },
    onSuccess: (order) => {
      monitoring.log(`Checkout: THÀNH CÔNG ${order.id}`);
      hapticSuccess();
      clearCart(); // CHỈ xóa giỏ SAU KHI Server xác nhận thành công
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => {
      hapticError();
      monitoring.recordError(err, 'CheckoutOrderFailed');
    },
  });

  if (isSuccess && data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={[styles.successText, { color: colors.text }]}>Đặt hàng thành công!</Text>
          <Text style={[styles.orderId, { color: colors.textLight }]}>Mã đơn: {data.id}</Text>
          <Text style={[styles.orderTotal, { color: colors.primary }]}>{formatCurrency(data.total)}</Text>
          <Text style={styles.pending}>⏳ Chờ thanh toán (PENDING)</Text>
          <ShopButton
            title="Xem hóa đơn & thanh toán"
            onPress={() => navigation.replace('OrderDetail', { orderId: data.id })}
            style={styles.successBtn}
          />
          <ShopButton
            title="Tiếp tục mua sắm"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.successBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Xác nhận đơn hàng</Text>

        <View style={[styles.box, { backgroundColor: colors.surface }]}>
          {items.map((item) => (
            <View key={item.id} style={styles.line}>
              <Text style={[styles.lineName, { color: colors.text }]} numberOfLines={1}>
                {item.quantity} × {item.name}
              </Text>
              <Text style={[styles.lineValue, { color: colors.text }]}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.line}>
            <Text style={[styles.label, { color: colors.textLight }]}>Số lượng</Text>
            <Text style={[styles.lineValue, { color: colors.text }]}>{totalQuantity}</Text>
          </View>
          <View style={styles.line}>
            <Text style={[styles.label, { color: colors.textLight }]}>Tổng cộng</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(totalPrice)}</Text>
          </View>
        </View>

        {isError && (
          <Text style={styles.errorText}>
            ⚠️ {apiErrorMessage(error, 'Đặt hàng thất bại — vui lòng thử lại!')}
          </Text>
        )}
        {isError && (
          <Text style={[styles.keepNote, { color: colors.textLight }]}>
            Giỏ hàng của bạn vẫn được giữ nguyên.
          </Text>
        )}

        <ShopButton
          title="Xác nhận đặt hàng"
          onPress={() => mutate()}
          isLoading={isPending}
          disabled={totalQuantity === 0}
          style={styles.confirmBtn}
          testID="confirm-order"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: SIZES.padding },
  title: { fontSize: SIZES.h1, fontWeight: '800', marginBottom: 16 },
  box: { borderRadius: SIZES.radius, padding: SIZES.padding },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lineName: { flex: 1, marginRight: 12 },
  lineValue: { fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  label: { fontSize: SIZES.body1 },
  totalValue: { fontSize: SIZES.h2, fontWeight: '900' },
  confirmBtn: { marginTop: 24 },
  errorText: { color: COLORS.danger, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  keepNote: { textAlign: 'center', marginTop: 4, fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  successIcon: { fontSize: 64, marginBottom: 12 },
  successText: { fontSize: SIZES.h2, fontWeight: '900', marginBottom: 6 },
  orderId: { fontSize: SIZES.body2 },
  orderTotal: { fontSize: SIZES.h1, fontWeight: '900', marginVertical: 8 },
  pending: { color: '#B45309', fontWeight: '700', marginBottom: 24 },
  successBtn: { marginTop: 12 },
});

export default CheckoutScreen;
