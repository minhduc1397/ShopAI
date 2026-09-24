import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Giữ đúng nguồn import — không lấy từ 'react-native'
import { useSelector, useDispatch } from 'react-redux';
import { addItem, removeItem } from '@store/redux/cartSlice';
import type { ReduxRootState } from '@store/redux/store';
import ShopButton from '@components/ui/ShopButton';

const ReduxCartDemoScreen = () => {
  const items = useSelector((state: ReduxRootState) => state.cartRedux.items);
  const dispatch = useDispatch();

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        [Demo Bắt Buộc Đề Cương] Redux Toolkit Cart
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>{item.name} x {item.quantity}</Text>
            <ShopButton title="Xóa" onPress={() => dispatch(removeItem(item.id))} style={{ width: 70, height: 32 }} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default ReduxCartDemoScreen;