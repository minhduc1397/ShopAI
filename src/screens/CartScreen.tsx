import React from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { maxQtyFor, useCartStore } from '@store/useCartStore';
import ShopButton from '@components/ui/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { formatCurrency } from '@utils/formatCurrency';
import { hapticLight } from '@utils/haptics';

const CartScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const items = useCartStore((state) => state.items);
  const increaseItem = useCartStore((state) => state.increaseItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.totalPrice());
  const totalQuantity = useCartStore((state) => state.totalQuantity());

  const confirmClear = () =>
    Alert.alert('Xóa toàn bộ giỏ hàng?', 'Bạn sẽ phải thêm lại sản phẩm từ đầu.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa hết', style: 'destructive', onPress: clearCart },
    ]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Giỏ hàng đang trống</Text>
          <Text style={[styles.emptyText, { color: colors.textLight }]}>
            Dạo một vòng Trang chủ, bấm “+” để thêm món bạn thích nhé.
          </Text>
          <ShopButton
            title="Đi mua sắm"
            onPress={() => navigation.navigate('HomeTab')}
            style={styles.emptyBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Giỏ hàng ({totalQuantity})</Text>
        <Pressable onPress={confirmClear} hitSlop={8}>
          <Text style={styles.clearText}>Xóa hết</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SIZES.padding }}
        renderItem={({ item }) => {
          const atMax = item.quantity >= maxQtyFor(item);
          return (
            <View style={[styles.cartItem, { backgroundColor: colors.surface }]}>
              <Image source={{ uri: item.image }} style={styles.thumb} />
              <View style={styles.itemBody}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
                <View style={styles.row}>
                  <View style={[styles.stepper, { borderColor: colors.border }]}>
                    <Pressable
                      testID={`dec-${item.id}`}
                      style={styles.stepBtn}
                      onPress={() => {
                        decreaseItem(item.id);
                        hapticLight();
                      }}
                      accessibilityLabel="Giảm số lượng"
                    >
                      <Text style={[styles.stepText, { color: colors.text }]}>−</Text>
                    </Pressable>
                    <Text style={[styles.qty, { color: colors.text }]}>{item.quantity}</Text>
                    <Pressable
                      testID={`inc-${item.id}`}
                      style={styles.stepBtn}
                      disabled={atMax}
                      onPress={() => {
                        increaseItem(item.id);
                        hapticLight();
                      }}
                      accessibilityLabel="Tăng số lượng"
                    >
                      <Text style={[styles.stepText, { color: atMax ? colors.border : colors.text }]}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                    <Text style={styles.removeText}>Xóa</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textLight }]}>Tạm tính</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(totalPrice)}</Text>
        </View>
        <Text style={[styles.note, { color: colors.textLight }]}>
          Giá cuối cùng do Server tính lại khi đặt hàng.
        </Text>
        <ShopButton title="Thanh toán" onPress={() => navigation.navigate('Checkout')} testID="go-checkout" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyTitle: { fontSize: SIZES.h3, fontWeight: '800', marginBottom: 6 },
  emptyText: { fontSize: SIZES.body2, textAlign: 'center' },
  emptyBtn: { marginTop: 24, width: 200 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: SIZES.h2, fontWeight: '800' },
  clearText: { color: COLORS.danger, fontWeight: '700' },
  cartItem: {
    flexDirection: 'row',
    borderRadius: SIZES.radius,
    padding: 10,
    marginBottom: 12,
  },
  thumb: { width: 76, height: 76, borderRadius: 10, backgroundColor: '#E5E7EB' },
  itemBody: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: SIZES.body2, fontWeight: '600' },
  itemPrice: { fontSize: SIZES.body1, fontWeight: '800', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999 },
  stepBtn: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, fontWeight: '700' },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '800' },
  removeText: { color: COLORS.danger, fontWeight: '600' },
  footer: { padding: SIZES.padding, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: SIZES.body1 },
  totalValue: { fontSize: SIZES.h2, fontWeight: '900' },
  note: { fontSize: 11, marginTop: 2, marginBottom: 12 },
});

export default CartScreen;
