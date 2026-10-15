import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ui/ShopButton';
import { maxQtyFor, useCartStore } from '@store/useCartStore';
import { Product } from '../types/product.schema';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { fetchProductById } from '@services/catalogApi';
import { formatCurrency } from '@utils/formatCurrency';
import { hapticMedium } from '@utils/haptics';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;

const CATEGORY_LABEL: Record<string, string> = {
  gaming: 'Gaming',
  computer: 'Máy tính',
  phone: 'Điện thoại & Tablet',
  audio: 'Âm thanh',
  camera: 'Máy ảnh',
  home: 'Nhà & Văn phòng',
};

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { productId } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);
  const inCart = useCartStore((state) => state.items.find((i) => i.id === productId)?.quantity ?? 0);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
    // Hiện ngay dữ liệu đã có trong cache danh sách (Home) trong lúc chờ Server trả chi tiết
    placeholderData: () =>
      queryClient
        .getQueriesData<Product[]>({ queryKey: ['productsAll'] })
        .flatMap(([, list]) => list ?? [])
        .find((p) => p.id === productId),
  });

  if (isLoading && !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.stateIcon}>🔍</Text>
        <Text style={[styles.notFound, { color: colors.text }]}>
          {(error as Error)?.message ?? 'Không tìm thấy sản phẩm'}
        </Text>
        <ShopButton title="Thử lại" variant="outline" onPress={() => refetch()} style={styles.retry} />
      </View>
    );
  }

  const limit = maxQtyFor(product);
  const reachedLimit = inCart >= limit;

  const buyNow = () => {
    if (!reachedLimit) addItem(product);
    hapticMedium();
    navigation.navigate('Cart'); // Tab Giỏ hàng nằm cùng MainTabs với HomeStack
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />

        <View style={styles.tagRow}>
          {product.category && (
            <Text style={[styles.tag, { backgroundColor: colors.primarySoft, color: colors.primary }]}>
              {CATEGORY_LABEL[product.category] ?? product.category}
            </Text>
          )}
          {product.brand && (
            <Text style={[styles.tag, { backgroundColor: colors.surface, color: colors.text }]}>
              {product.brand}
            </Text>
          )}
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(product.price)}</Text>

        <View style={[styles.metaRow, { borderColor: colors.border }]}>
          <View style={styles.meta}>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              ★ {product.rating?.toFixed(1) ?? '—'}
            </Text>
            <Text style={[styles.metaLabel, { color: colors.textLight }]}>Đánh giá</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.metaValue, { color: colors.text }]}>{product.stock ?? '—'}</Text>
            <Text style={[styles.metaLabel, { color: colors.textLight }]}>Còn hàng</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.metaValue, { color: colors.text }]}>{inCart}</Text>
            <Text style={[styles.metaLabel, { color: colors.textLight }]}>Trong giỏ</Text>
          </View>
        </View>

        {product.description ? (
          <Text style={[styles.description, { color: colors.text }]}>{product.description}</Text>
        ) : null}
        <Text style={[styles.idNote, { color: colors.textLight }]}>
          Mã sản phẩm: {product.id} · Deep link: shopai://product/{product.id}
        </Text>
        {reachedLimit && (
          <Text style={styles.limitNote}>Đã đạt giới hạn {limit} sản phẩm cùng loại cho mỗi đơn.</Text>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ShopButton
          title="Thêm vào giỏ"
          variant="outline"
          disabled={reachedLimit}
          onPress={() => {
            addItem(product);
            hapticMedium();
          }}
          style={styles.half}
        />
        <ShopButton title="Mua ngay" onPress={buyNow} style={styles.half} testID="buy-now" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: SIZES.padding, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  stateIcon: { fontSize: 40, marginBottom: 8 },
  image: { width: '100%', aspectRatio: 1.1, borderRadius: SIZES.radius, marginBottom: SIZES.padding },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  name: { fontSize: SIZES.h2, fontWeight: '800', marginBottom: 6 },
  price: { fontSize: SIZES.h1, fontWeight: '900', marginBottom: 12 },
  metaRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  meta: { flex: 1, alignItems: 'center' },
  metaValue: { fontSize: SIZES.body1, fontWeight: '800' },
  metaLabel: { fontSize: 12, marginTop: 2 },
  description: { fontSize: SIZES.body1, lineHeight: 23, marginBottom: 16 },
  idNote: { fontSize: 12 },
  limitNote: { marginTop: 8, color: COLORS.warning, fontWeight: '600' },
  notFound: { fontSize: SIZES.body1, textAlign: 'center', marginBottom: 8 },
  retry: { width: 160, marginTop: 8 },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: SIZES.padding,
    borderTopWidth: 1,
  },
  half: { flex: 1, width: undefined },
});

export default ProductDetailScreen;
