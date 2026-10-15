import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addItem, clearCart, removeItem } from '@store/redux/cartSlice';
import type { ReduxRootState } from '@store/redux/store';
import ShopButton from '@components/ui/ShopButton';
import { SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { formatCurrency } from '@utils/formatCurrency';
import type { Product } from '../types/product.schema';

// 3 món cố định để bấm thử — bài này chỉ minh họa luồng dispatch → reducer → useSelector,
// hoàn toàn TÁCH BIỆT với giỏ hàng thật (Zustand) của ShopAI.
const SAMPLE: Product[] = [
  { id: 'rtk_1', name: 'Bàn phím cơ (RTK)', price: 1890000, image: 'https://picsum.photos/seed/rtk1/200' },
  {
    id: 'rtk_2',
    name: 'Chuột không dây (RTK)',
    price: 1250000,
    image: 'https://picsum.photos/seed/rtk2/200',
  },
  { id: 'rtk_3', name: 'Tai nghe (RTK)', price: 890000, image: 'https://picsum.photos/seed/rtk3/200' },
];

const ReduxCartDemoScreen = () => {
  const { colors } = useTheme();
  const items = useSelector((state: ReduxRootState) => state.cartRedux.items);
  const dispatch = useDispatch();
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Text style={[styles.note, { color: colors.textLight }]}>
        createSlice + configureStore + useSelector/useDispatch. So sánh: giỏ hàng thật của app dùng Zustand
        (ít boilerplate hơn, có persist sẵn).
      </Text>

      <View style={styles.samples}>
        {SAMPLE.map((p) => (
          <ShopButton
            key={p.id}
            title={`+ ${p.name.replace(' (RTK)', '')}`}
            variant="ghost"
            onPress={() => dispatch(addItem(p))}
            style={styles.sampleBtn}
            textStyle={{ fontSize: 13 }}
          />
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SIZES.padding }}
        ListEmptyComponent={
          <Text style={{ color: colors.textLight, textAlign: 'center' }}>
            Store Redux đang rỗng — bấm nút ở trên.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.surface }]}>
            <Text style={{ flex: 1, color: colors.text }}>
              {item.name} × {item.quantity}
            </Text>
            <ShopButton
              title="Xóa"
              variant="danger"
              onPress={() => dispatch(removeItem(item.id))}
              style={styles.removeBtn}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        )}
      />

      <View style={[styles.footer, { borderColor: colors.border }]}>
        <Text style={[styles.total, { color: colors.text }]}>Tổng (Redux): {formatCurrency(total)}</Text>
        <ShopButton title="dispatch(clearCart())" variant="outline" onPress={() => dispatch(clearCart())} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  note: { padding: SIZES.padding, paddingBottom: 0, fontSize: 13, lineHeight: 19 },
  samples: { flexDirection: 'row', gap: 8, padding: SIZES.padding },
  sampleBtn: { flex: 1, width: undefined, height: 40, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  removeBtn: { width: 64, height: 32 },
  footer: { padding: SIZES.padding, borderTopWidth: 1, gap: 10 },
  total: { fontWeight: '800', fontSize: 16 },
});

export default ReduxCartDemoScreen;
