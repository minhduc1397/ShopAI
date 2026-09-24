import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SIZES } from '@constants/theme';
import ShopButton from './ui/ShopButton';
import { Product } from '../types/product.schema';
import { useCartStore } from '@store/useCartStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - (SIZES.padding * 1.5);

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
const addItem = useCartStore((state) => state.addItem);

  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </Text>

        <ShopButton
          title="Mua ngay"
          onPress={() => addItem(product)}
          style={styles.button}
          textStyle={{ fontSize: 12 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  infoContainer: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    height: 40,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  button: {
    height: 36,
    paddingVertical: 0,
    justifyContent: 'center',
  },
});

export default memo(ProductCard);