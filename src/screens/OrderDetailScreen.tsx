import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ui/ShopButton';
import StatusBadge from '@components/StatusBadge';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { RootStackParamList } from '@navigation/RootStackNavigator';
import { fetchOrder, payOrder } from '@api/orderApi';
import { apiErrorMessage } from '@api/apiError';
import { formatCurrency } from '@utils/formatCurrency';
import { hapticSuccess } from '@utils/haptics';
import { monitoring } from '@services/monitoring';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const OrderDetailScreen = ({ route }: Props) => {
  const { orderId } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const payMutation = useMutation({
    mutationFn: () => payOrder(orderId),
    onSuccess: (paid) => {
      hapticSuccess();
      queryClient.setQueryData(['order', orderId], paid); // cập nhật ngay, không chờ refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => monitoring.recordError(err, 'PayOrderFailed'),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.missing, { color: colors.textLight }]}>
          {apiErrorMessage(error, `Không tìm thấy đơn ${orderId}`)}
        </Text>
        <ShopButton title="Thử lại" variant="outline" onPress={() => refetch()} style={styles.retry} />
      </View>
    );
  }

  const quantity = order.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Phần đầu hóa đơn */}
        <View style={[styles.receipt, { backgroundColor: colors.surface }]}>
          <View style={styles.receiptTop}>
            <Text style={[styles.shop, { color: colors.text }]}>
              Shop<Text style={{ color: colors.primary }}>AI</Text> · Hóa đơn
            </Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={[styles.meta, { color: colors.textLight }]}>Mã: {order.id}</Text>
          <Text style={[styles.meta, { color: colors.textLight }]}>
            Ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </Text>

          <View style={[styles.dash, { borderColor: colors.border }]} />

          {order.items.map((it) => (
            <View key={it.id ?? it.productId} style={styles.itemRow}>
              {it.image ? <Image source={{ uri: it.image }} style={styles.thumb} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {it.name ?? it.productId}
                </Text>
                <Text style={[styles.itemSub, { color: colors.textLight }]}>
                  {it.quantity} × {formatCurrency(it.price)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                {formatCurrency(it.price * it.quantity)}
              </Text>
            </View>
          ))}

          <View style={[styles.dash, { borderColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textLight }]}>Tổng ({quantity} sản phẩm)</Text>
            <Text style={[styles.total, { color: colors.primary }]}>{formatCurrency(order.total)}</Text>
          </View>
          <Text style={[styles.snapshot, { color: colors.textLight }]}>
            Giá được chốt tại thời điểm đặt hàng — Server tự tính, không tin số Client gửi lên.
          </Text>
        </View>

        {order.status === 'PENDING' ? (
          <>
            {payMutation.isError && (
              <Text style={styles.payError}>
                ⚠️ {apiErrorMessage(payMutation.error, 'Thanh toán thất bại')}
              </Text>
            )}
            <ShopButton
              title="Thanh toán giả lập (→ PAID)"
              onPress={() => payMutation.mutate()}
              isLoading={payMutation.isPending}
              style={styles.payBtn}
              testID="pay-order"
            />
          </>
        ) : (
          <Text style={styles.paidNote}>✓ Đơn đã được thanh toán</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  missing: { textAlign: 'center' },
  retry: { width: 160, marginTop: 16 },
  receipt: { borderRadius: SIZES.radius, padding: SIZES.padding },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shop: { fontSize: SIZES.h3, fontWeight: '900' },
  meta: { fontSize: 13, marginTop: 2 },
  dash: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#E5E7EB' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 12, marginTop: 2 },
  itemTotal: { fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: SIZES.body2 },
  total: { fontSize: SIZES.h2, fontWeight: '900' },
  snapshot: { fontSize: 11, marginTop: 8 },
  payBtn: { marginTop: 24 },
  payError: { marginTop: 16, color: COLORS.danger, textAlign: 'center' },
  paidNote: { marginTop: 24, color: COLORS.success, fontWeight: '800', textAlign: 'center', fontSize: 16 },
});

export default OrderDetailScreen;
