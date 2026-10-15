import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ShopButton from '@components/ui/ShopButton';
import { useOrderStore } from '@store/useOrderStore';
import { COLORS, SIZES } from '@constants/theme';
import { RootStackParamList } from '@navigation/RootStackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';

const OrderDetailScreen = ({ route }: Props) => {
  const { orderId } = route.params;
  const queryClient = useQueryClient();
  const localOrder = useOrderStore((s) => s.getById(orderId));
  const markPaid = useOrderStore((s) => s.markPaid);

  const { data: serverOrder, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await axiosClient.get(`/api/orders/${orderId}`);
      return res.data;
    },
    placeholderData: localOrder,
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post(`/api/orders/${orderId}/pay`);
      return res.data;
    },
    onSuccess: () => {
      markPaid(orderId);
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const order = serverOrder ?? localOrder;

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Không tìm thấy đơn {orderId}</Text>
      </SafeAreaView>
    );
  }

  const items = order.items ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Hóa đơn</Text>
        <Text style={styles.row}>Mã: {order.id}</Text>
        <Text style={styles.row}>Trạng thái: {order.status}</Text>
        <Text style={styles.row}>Ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}</Text>

        <Text style={[styles.heading, { marginTop: 20 }]}>Chi tiết</Text>
        {items.map((it: any) => (
          <View key={it.id || it.productId} style={styles.itemRow}>
            <Text style={{ flex: 1 }}>{it.name || it.product?.name || it.productId} × {it.quantity}</Text>
            <Text>{formatCurrency((it.price ?? it.product?.price ?? 0) * it.quantity)}</Text>
          </View>
        ))}

        <Text style={styles.total}>Tổng: {formatCurrency(order.total)}</Text>

        {order.status === 'PENDING' ? (
          <ShopButton
            title={payMutation.isPending ? 'Đang thanh toán...' : 'Thanh toán giả lập (→ PAID)'}
            onPress={() => payMutation.mutate()}
            isLoading={payMutation.isPending}
            style={{ marginTop: 24 }}
          />
        ) : (
          <Text style={styles.paidNote}>Đã thanh toán ✓</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.padding },
  heading: { fontSize: SIZES.h3, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  row: { marginBottom: 4, color: COLORS.text },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  total: { marginTop: 16, fontSize: SIZES.h3, fontWeight: '800', color: COLORS.text },
  paidNote: { marginTop: 24, color: 'green', fontWeight: '700', textAlign: 'center' },
  missing: { padding: 24, color: COLORS.textLight },
});

export default OrderDetailScreen;