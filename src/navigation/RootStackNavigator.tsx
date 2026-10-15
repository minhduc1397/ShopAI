import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from '@navigation/MainTabNavigator';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';
import ReduxCartDemoScreen from '@screens/ReduxCartDemoScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Checkout: undefined;
  OrderDetail: { orderId: string };
  ReduxCartDemo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab bar chứa Khám phá, Giỏ hàng, Đơn hàng, Tài khoản */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Modal thanh toán trượt từ dưới lên */}
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ presentation: 'modal', headerShown: true, title: 'Thanh toán' }}
      />

      {/* Chi tiết hóa đơn nhận tham số { orderId } */}
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: true, title: 'Chi tiết hóa đơn' }}
      />

      {/* Bài tập bắt buộc đề cương 5.2 — Redux Toolkit chạy song song Zustand */}
      <Stack.Screen
        name="ReduxCartDemo"
        component={ReduxCartDemoScreen}
        options={{ headerShown: true, title: 'Demo Redux Toolkit' }}
      />
    </Stack.Navigator>
  );
};

export default RootStackNavigator;
