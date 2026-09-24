import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStackNavigator from '@navigation/HomeStackNavigator';
import CartScreen from '@screens/CartScreen';
import OrdersScreen from '@screens/OrdersScreen';
import { useCartStore } from '@store/useCartStore';

// Khai báo Type cho tầng Tab bao gồm cả tab Orders mới
export type MainTabParamList = {
  HomeTab: undefined;
  Cart: undefined;
  Orders: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  // Đọc tổng số lượng sản phẩm từ Zustand Store để hiển thị Badge cho giỏ hàng
  const items = useCartStore(state => state.items);
  const cartBadgeCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Trang chủ',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Giỏ hàng',
          tabBarBadge: cartBadgeCount > 0 ? cartBadgeCount : undefined,
          tabBarIcon: () => <Text>🛒</Text>,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'Đơn hàng',
          tabBarIcon: () => <Text>🧾</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;