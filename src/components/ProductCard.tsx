import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { Product } from '../types/product.schema';
import { useCartStore } from '@store/useCartStore';
import { formatCurrency } from '@utils/formatCurrency';
import { hapticLight } from '@utils/haptics';

interface Props {
  product: Product;
  onPress?: () => void;
}

const LOW_STOCK = 5;

const ProductCard = ({ product, onPress }: Props) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  // 2 cột, chừa padding 2 bên + khe giữa
  const cardWidth = (width - SIZES.padding * 3) / 2;
  const lowStock = product.stock != null && product.stock <= LOW_STOCK;

  const handleAdd = () => {
    addItem(product);
    hapticLight();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width: cardWidth, backgroundColor: colors.surface }]}
      accessibilityRole="button"
      accessibilityLabel={product.name}
    >
      <View>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        {lowStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>Chỉ còn {product.stock}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        {product.brand ? (
          <Text style={[styles.brand, { color: colors.primary }]}>{product.brand.toUpperCase()}</Text>
        ) : null}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        {product.rating != null && (
          <Text style={[styles.rating, { color: colors.textLight }]}>★ {product.rating.toFixed(1)}</Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.text }]} numberOfLines={1}>
            {formatCurrency(product.price)}
          </Text>
          <Pressable
            onPress={handleAdd}
            hitSlop={8}
            style={[styles.addBtn, justAdded && styles.addBtnDone]}
            accessibilityRole="button"
            accessibilityLabel={`Thêm ${product.name} vào giỏ`}
            testID={`add-${product.id}`}
          >
            <Text style={styles.addText}>{justAdded ? '✓' : '+'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: SIZES.padding,
    elevation: 2,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#E5E7EB' },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stockText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  info: { padding: 10 },
  brand: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  name: { fontSize: 13, fontWeight: '600', minHeight: 36 },
  rating: { fontSize: 11, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  price: { flex: 1, fontSize: 14, fontWeight: '800' },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDone: { backgroundColor: COLORS.success },
  addText: { color: COLORS.white, fontSize: 18, fontWeight: '800', lineHeight: 20 },
});

export default memo(ProductCard);
