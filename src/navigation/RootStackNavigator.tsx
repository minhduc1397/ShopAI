import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from '@navigation/MainTabNavigator';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab bar chứa Trang chủ, Giỏ hàng, Đơn hàng */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Modal thanh toán trượt từ dưới lên */}
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Thanh toán',
        }}
      />

      {/* Màn hình xem chi tiết hóa đơn nhận tham số { orderId } */}
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{
          headerShown: true,
          title: 'Chi tiết hóa đơn',
        }}
      />
    </Stack.Navigator>
  );
};

export default RootStackNavigator;