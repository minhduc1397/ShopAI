import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import ProductCard from '@components/ProductCard';
import ShopButton from '@components/ui/ShopButton';
import LocationBadge from '@components/LocationBadge';
import { COLORS, SIZES } from '@constants/theme';
import { APP_VERSION } from '@constants/env';
import { useTheme } from '@contexts/ThemeContext';
import { CatalogError, fetchCategories, fetchProducts, pingServer } from '@services/catalogApi';
import { monitoring } from '@services/monitoring';
import { Product, ProductCategory } from '../types/product.schema';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import type { MainTabParamList } from '@navigation/MainTabNavigator';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<MainTabParamList>
>;

const PAGE_SIZE = 6;

// Dùng khi Server chưa trả danh mục — chip vẫn hiện, lọc vẫn chạy phía Server
const FALLBACK_CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'gaming', label: 'Gaming' },
  { id: 'computer', label: 'Máy tính' },
  { id: 'phone', label: 'Điện thoại & Tablet' },
  { id: 'audio', label: 'Âm thanh' },
  { id: 'camera', label: 'Máy ảnh' },
  { id: 'home', label: 'Nhà & Văn phòng' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng ☀️';
  if (h < 14) return 'Chào buổi trưa 🍜';
  if (h < 18) return 'Chào buổi chiều 🌤️';
  return 'Chào buổi tối 🌙';
};

/** Gõ xong 350ms mới gọi Server — không bắn request theo từng phím */
const useDebounced = (value: string, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const errorView = (error: unknown) => {
  if (error instanceof CatalogError && error.kind === 'network') {
    return { icon: '📡', title: 'Mất kết nối tới Server', message: error.message };
  }
  if (error instanceof CatalogError && error.kind === 'invalid_data') {
    return { icon: '🧪', title: 'Dữ liệu không hợp lệ', message: error.message };
  }
  return {
    icon: '⚠️',
    title: 'Không tải được sản phẩm',
    message: error instanceof Error ? error.message : 'Có lỗi xảy ra',
  };
};

const HomeScreen = ({ navigation, route }: Props) => {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const scannedCode = route.params?.scannedCode;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const keyword = useDebounced(search);

  const { data: categories = FALLBACK_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });

  const { data: isOnline, refetch: recheckServer } = useQuery({
    queryKey: ['serverHealth'],
    queryFn: pingServer,
    refetchInterval: 15000,
  });

  // Toàn bộ danh sách (đã lọc) được cache 1 lần; các "trang" chỉ cắt lát từ cache này
  const loadAll = useCallback(
    () =>
      queryClient.fetchQuery({
        queryKey: ['productsAll', category, keyword],
        queryFn: () => fetchProducts({ category, q: keyword }),
      }),
    [queryClient, category, keyword],
  );

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
    queryKey: ['productsInfinite', category, keyword],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const all = await loadAll();
      const start = (pageParam - 1) * PAGE_SIZE;
      return {
        items: all.slice(start, start + PAGE_SIZE),
        nextPage: start + PAGE_SIZE < all.length ? pageParam + 1 : null,
        total: all.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const onRefresh = useCallback(async () => {
    // Kéo để làm mới: bỏ cache danh sách rồi tải lại từ trang 1
    await queryClient.invalidateQueries({ queryKey: ['productsAll'] });
    recheckServer();
    refetch();
  }, [queryClient, recheckServer, refetch]);

  const openProduct = useCallback(
    (product: Product) => navigation.navigate('ProductDetail', { productId: product.id }),
    [navigation],
  );

  const failure = isError ? errorView(error) : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hello, { color: colors.textLight }]}>{greeting()}</Text>
          <View style={styles.brandRow}>
            <Text style={[styles.brand, { color: colors.text }]}>
              Shop<Text style={{ color: colors.primary }}>AI</Text>
            </Text>
            <View
              testID="server-status"
              style={[
                styles.dot,
                {
                  backgroundColor:
                    isOnline == null ? COLORS.border : isOnline ? COLORS.success : COLORS.error,
                },
              ]}
            />
            <Text style={[styles.dotLabel, { color: colors.textLight }]}>
              {isOnline == null ? 'Đang kiểm tra…' : isOnline ? 'Server online' : 'Server offline'}
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => navigation.navigate('Scanner')}
          accessibilityLabel="Quét mã"
        >
          <Text style={styles.iconText}>📷</Text>
        </Pressable>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AIChat')}
          accessibilityLabel="Hỏi trợ lý AI"
        >
          <Text style={styles.iconText}>✨</Text>
        </Pressable>
      </View>

      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshing={isRefetching}
        onRefresh={onRefresh}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            <LocationBadge />

            {scannedCode && (
              <View style={styles.scannedBanner}>
                <Text style={styles.scannedText} numberOfLines={1}>
                  🔍 Mã vừa quét: {scannedCode}
                </Text>
                {/^prod_\d+$/.test(scannedCode) && (
                  <Pressable onPress={() => navigation.navigate('ProductDetail', { productId: scannedCode })}>
                    <Text style={styles.scannedLink}>Mở sản phẩm →</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.searchIcon}>🔎</Text>
              <TextInput
                testID="search-input"
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tai nghe, bàn phím, iPhone…"
                placeholderTextColor={colors.textLight}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={{ color: colors.textLight, fontSize: 16 }}>✕</Text>
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {[{ id: null, label: 'Tất cả' }, ...categories].map((c) => {
                const active = c.id === category;
                return (
                  <Pressable
                    key={c.id ?? 'all'}
                    onPress={() => setCategory(c.id as ProductCategory | null)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? COLORS.white : colors.text }]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {!isLoading && !isError && (
              <Text style={[styles.resultCount, { color: colors.textLight }]}>
                {keyword ? `${total} kết quả cho “${keyword}”` : `${total} sản phẩm`}
              </Text>
            )}

            {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />}

            {failure && (
              <View style={[styles.stateBox, { backgroundColor: colors.surface }]}>
                <Text style={styles.stateIcon}>{failure.icon}</Text>
                <Text style={[styles.stateTitle, { color: colors.text }]}>{failure.title}</Text>
                <Text style={[styles.stateMsg, { color: colors.textLight }]}>{failure.message}</Text>
                <ShopButton title="Thử lại" variant="outline" onPress={onRefresh} style={styles.retryBtn} />
              </View>
            )}

            {!isLoading && !isError && total === 0 && (
              <View style={[styles.stateBox, { backgroundColor: colors.surface }]}>
                <Text style={styles.stateIcon}>🫥</Text>
                <Text style={[styles.stateTitle, { color: colors.text }]}>
                  Không tìm thấy sản phẩm phù hợp
                </Text>
                <Text style={[styles.stateMsg, { color: colors.textLight }]}>
                  Thử từ khóa khác hoặc hỏi trợ lý AI ✨
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          // Fade-in so le từng thẻ (Reanimated — Chương 4)
          <Animated.View
            style={styles.cell}
            entering={FadeInDown.delay((index % PAGE_SIZE) * 60).duration(350)}
          >
            <ProductCard product={item} onPress={() => openProduct(item)} />
          </Animated.View>
        )}
        ListFooterComponent={
          <View>
            {isFetchingNextPage && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            )}
            {__DEV__ && (
              // Cửa sau test crash (Chương 10) — chỉ tồn tại ở bản Dev
              <Pressable onLongPress={() => monitoring.testCrash()} delayLongPress={2000}>
                <Text style={styles.devVersion}>ShopAI v{APP_VERSION} · Dev: giữ 2s để test crash</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
  },
  hello: { fontSize: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brand: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10, marginRight: 4 },
  dotLabel: { fontSize: 11 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  listContent: { paddingHorizontal: SIZES.padding / 2, paddingBottom: 24 },
  cell: { alignItems: 'center' },
  scannedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    marginHorizontal: SIZES.padding / 2,
    marginTop: 8,
    padding: 10,
    borderRadius: SIZES.radius,
  },
  scannedText: { flex: 1, fontWeight: '600', color: '#78350F', fontSize: 13 },
  scannedLink: { color: COLORS.primary, fontWeight: '800', marginLeft: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.padding / 2,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  chips: { paddingHorizontal: SIZES.padding / 2, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  resultCount: { fontSize: 12, marginHorizontal: SIZES.padding / 2, marginBottom: 8 },
  stateBox: {
    margin: SIZES.padding / 2,
    padding: 24,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  stateIcon: { fontSize: 40, marginBottom: 8 },
  stateTitle: { fontSize: SIZES.body1, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  stateMsg: { fontSize: 13, textAlign: 'center' },
  retryBtn: { marginTop: 16, width: 160, height: 42 },
  devVersion: { textAlign: 'center', fontSize: 10, color: '#9CA3AF', paddingVertical: 12 },
});

export default HomeScreen;
