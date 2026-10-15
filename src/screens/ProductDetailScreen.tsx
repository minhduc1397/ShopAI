import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ui/ShopButton';
import { useCartStore } from '@store/useCartStore';
import { Product, ProductSchema } from '../types/product.schema';
import { COLORS, SIZES } from '@constants/theme';
import { API_BASE_URL } from '@constants/api';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;

// Khớp đúng khuôn 1 "trang" dữ liệu mà HomeScreen (Bước 8) đã dùng cho useInfiniteQuery
interface ProductPage {
  items: Product[];
  nextPage: number | null;
}

const fetchProductById = async (id: string): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
  if (response.status === 404) {
    throw new Error('Sản phẩm này không còn tồn tại trên hệ thống');
  }
  if (!response.ok) {
    throw new Error('Lỗi mạng khi tải chi tiết sản phẩm');
  }
  const raw = await response.json();
  const result = ProductSchema.safeParse(raw);
  if (!result.success) {
    throw new Error('Dữ liệu chi tiết sản phẩm không hợp lệ (Zod)');
  }
  return result.data;
};

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
    placeholderData: () => {
      const infiniteData = queryClient.getQueryData<{ pages: ProductPage[] }>(['productsInfinite']);
      const fromInfinite = infiniteData?.pages.flatMap((page) => page.items).find((p) => p.id === productId);
      if (fromInfinite) return fromInfinite;
      const listData = queryClient.getQueryData<Product[]>(['productsList']);
      return listData?.find((p) => p.id === productId);
    },
  });

  if (isLoading && !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Đang tải chi tiết sản phẩm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFound}>{(error as Error)?.message ?? 'Không tìm thấy sản phẩm'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </Text>
        <Text style={styles.idNote}>Mã sản phẩm: {product.id}</Text>
        <ShopButton title="Thêm vào giỏ hàng" onPress={() => addItem(product)} style={styles.buyBtn} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  image: { width: '100%', height: 320, borderRadius: SIZES.radius, marginBottom: SIZES.padding },
  name: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  price: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  idNote: { fontSize: SIZES.body2, color: COLORS.textLight, marginBottom: 24 },
  buyBtn: { marginTop: 8 },
  notFound: { fontSize: SIZES.body1, color: COLORS.error, textAlign: 'center', marginBottom: 8 },
  hint: { fontSize: SIZES.body2, color: COLORS.textLight, textAlign: 'center' },
});

export default ProductDetailScreen;