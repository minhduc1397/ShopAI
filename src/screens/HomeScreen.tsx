import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ProductCard from '@components/ProductCard';
import ShopButton from '@components/ui/ShopButton';
import LocationBadge from '@components/LocationBadge';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { Product, ProductListSchema } from '../types/product.schema';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import type { MainTabParamList } from '@navigation/MainTabNavigator';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

const PAGE_SIZE = 6;

// DANH SÁCH SẢN PHẨM THỰC TẾ
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Bàn phím cơ ATK68 Magnetic Switch',
    price: 1890000,
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_2',
    name: 'Chuột Gaming không dây ATK Blazing F1 Pro',
    price: 1250000,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_3',
    name: 'Rubik 3x3 MoYu WeiLong WRM V9 Magnetic',
    price: 520000,
    image: 'https://images.unsplash.com/photo-1591994843349-f415893b3a6b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_4',
    name: 'Màn hình Gaming Fast IPS 240Hz 24.5 inch',
    price: 4650000,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_5',
    name: 'Tai nghe chụp tai Gaming SoundPeats ANC',
    price: 890000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_6',
    name: 'Lót chuột Cordura Gaming Speed Control XL',
    price: 320000,
    image: 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_7',
    name: 'Bàn phím Custom Nhôm CNC 3-Mode Wireless',
    price: 2450000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_8',
    name: 'Đồng hồ bấm giờ Speedcubing GAN Timer',
    price: 480000,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_9',
    name: 'Tay cầm chơi game không dây Hall Effect Pro',
    price: 950000,
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'prod_10',
    name: 'Dầu bôi trơn Rubik GAN Lube chuyên dụng',
    price: 110000,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  },
];

import { API_BASE_URL } from '@constants/api';

interface ProductPage {
  items: Product[];
  nextPage: number | null;
}

class ZodValidationError extends Error {}

const fetchProductsPage = async ({ pageParam }: { pageParam: number }): Promise<ProductPage> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (!response.ok) {
      throw new Error('Lỗi mạng từ Server NestJS');
    }
    const rawData = await response.json();
    const result = ProductListSchema.safeParse(rawData);
    if (!result.success) {
      console.error('❌ Zod chặn dữ liệu bẩn từ Server NestJS:', result.error.format());
      throw new ZodValidationError('Dữ liệu sản phẩm từ Server không hợp lệ (Zod validation failed)!');
    }

    const allProducts = result.data;
    const start = (pageParam - 1) * PAGE_SIZE;
    const pagedItems = allProducts.slice(start, start + PAGE_SIZE);
    const hasMore = start + PAGE_SIZE < allProducts.length;
    return { items: pagedItems, nextPage: hasMore ? pageParam + 1 : null };
  } catch (err: any) {
    // Nếu NestJS tạm thời chưa bật, fallback sang mock data để app không bị treo trắng
    const start = (pageParam - 1) * PAGE_SIZE;
    const pagedItems = MOCK_PRODUCTS.slice(start, start + PAGE_SIZE);
    const hasMore = start + PAGE_SIZE < MOCK_PRODUCTS.length;
    return { items: pagedItems, nextPage: hasMore ? pageParam + 1 : null };
  }
};

const HomeScreen = ({ navigation, route }: Props) => {
  const logout = useAuthStore((state) => state.logout);
  const totalQuantity = useCartStore((state) => state.totalQuantity());

  const scannedCode = route.params?.scannedCode;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['productsInfinite'],
    queryFn: fetchProductsPage,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allProducts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header điều hướng */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <ShopButton
              title="Hỏi AI"
              onPress={() => navigation.navigate('AIChat')}
              style={{ width: 'auto', paddingHorizontal: 10, height: 32, backgroundColor: COLORS.primary }}
              textStyle={{ fontSize: 12 }}
            />
            <ShopButton
              title="Quét Mã"
              onPress={() => navigation.navigate('Scanner')}
              style={{ width: 'auto', paddingHorizontal: 10, height: 32, backgroundColor: COLORS.secondary }}
              textStyle={{ fontSize: 12 }}
            />
            <ShopButton
              title="Thoát"
              onPress={logout}
              style={{ width: 'auto', paddingHorizontal: 10, height: 32 }}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </View>

        {/* Thẻ vị trí + phí ship — tự dò GPS khi màn hình mount */}
        <LocationBadge />

        {/* Báo cáo nếu quét mã vạch thành công */}
        {scannedCode && (
          <View style={styles.scannedBanner}>
            <Text style={styles.scannedText}>🔍 Mã vừa quét: {scannedCode}</Text>
          </View>
        )}

        {isLoading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />}

        {isError && (
          <Text style={{ textAlign: 'center', marginTop: 50, color: 'red' }}>
            {error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu!'}
          </Text>
        )}

        {allProducts.length > 0 && (
          <FlashList
            data={allProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
                <ProductCard product={item} />
              </Pressable>
            )}
            numColumns={2}
            contentContainerStyle={{ padding: SIZES.padding }}
            refreshing={isRefetching}
            onRefresh={refetch}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scannedBanner: {
    backgroundColor: '#FFF9C4',
    borderBottomWidth: 1,
    borderBottomColor: '#FFF176',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  scannedText: {
    fontWeight: '600',
    color: '#333',
    fontSize: 13,
  },
});

export default HomeScreen;