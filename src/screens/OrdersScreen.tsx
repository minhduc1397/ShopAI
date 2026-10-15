import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import ShopButton from '@components/ui/ShopButton';
import StatusBadge from '@components/StatusBadge';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { fetchMyOrders } from '@api/orderApi';
import { apiErrorMessage } from '@api/apiError';
import { formatCurrency } from '@utils/formatCurrency';

type Filter = 'ALL' | 'PENDING' | 'PAID';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ thanh toán' },
  { id: 'PAID', label: 'Đã thanh toán' },
];

const OrdersScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('ALL');

  // Nguồn dữ liệu DUY NHẤT là Server (Chương 9) — không trộn đơn lưu cục bộ của user khác
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchMyOrders,
  });

  const visible = useMemo(
    () => (filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.text }]}>Đơn hàng của tôi</Text>

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f.id === filter;
          const count = f.id === 'ALL' ? orders.length : orders.filter((o) => o.status === f.id).length;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filter,
                { borderColor: colors.border, backgroundColor: colors.surface },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? COLORS.white : colors.text }]}>
                {f.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            {apiErrorMessage(error, 'Không tải được đơn hàng')}
          </Text>
          <ShopButton title="Thử lại" variant="outline" onPress={() => refetch()} style={styles.retry} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{ padding: SIZES.padding, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={[styles.emptyText, { color: colors.textLight }]}>
                {orders.length === 0
                  ? 'Chưa có đơn nào. Hãy đặt hàng từ Giỏ.'
                  : 'Không có đơn ở trạng thái này.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const count = item.items.reduce((s, it) => s + it.quantity, 0);
            return (
              <Pressable
                style={[styles.card, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.orderId, { color: colors.text }]}>{item.id}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={[styles.itemsLine, { color: colors.textLight }]} numberOfLines={1}>
                  {count} sản phẩm · {item.items.map((it) => it.name ?? it.productId).join(', ')}
                </Text>
                <View style={styles.cardBottom}>
                  <Text style={[styles.date, { color: colors.textLight }]}>
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </Text>
                  <Text style={[styles.total, { color: colors.primary }]}>{formatCurrency(item.total)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: SIZES.h1, fontWeight: '900', paddingHorizontal: SIZES.padding, paddingTop: 12 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: SIZES.padding, paddingTop: 12 },
  filter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { textAlign: 'center' },
  retry: { width: 160, marginTop: 16 },
  card: { padding: 14, borderRadius: SIZES.radius, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontWeight: '800', fontSize: SIZES.body2 },
  itemsLine: { marginTop: 6, fontSize: 13 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  date: { fontSize: 12 },
  total: { fontSize: SIZES.body1, fontWeight: '900' },
});

export default OrdersScreen;
