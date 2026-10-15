// App.tsx
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { reduxStore } from '@store/redux/store';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';
import RootStackNavigator from '@navigation/RootStackNavigator';
import BiometricGateScreen from '@screens/BiometricGateScreen';
import AppErrorBoundary from '@components/AppErrorBoundary';
import { useAuthStore } from '@store/useAuthStore';
import { useAppLock } from '@hooks/useAppLock';
import { COLORS } from '@constants/theme';
import { API_BASE_URL, APP_ENV, APP_VERSION } from '@constants/env';
import { monitoring } from '@services/monitoring';

const AuthStack = createNativeStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu giữ trạng thái tươi trong 5 phút
      retry: 1,
    },
  },
});

// Cấu hình Deep Linking — thử: adb shell am start -a android.intent.action.VIEW -d "shopai://product/prod_3"
const linking: LinkingOptions<any> = {
  prefixes: ['shopai://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              ProductDetail: 'product/:productId',
            },
          },
          Cart: 'cart',
          Orders: 'orders',
        },
      },
      OrderDetail: 'order/:orderId',
    },
  },
};

/** Navigation đọc Theme Sáng/Tối để header + tab bar đổi màu theo */
function ThemedNavigation({ token }: { token: string | null }) {
  const { isDark, colors } = useTheme();

  const navTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  return (
    <>
      {/* RN 0.87 chạy edge-to-edge: chỉ đổi màu chữ status bar, nền do màn hình bên dưới quyết định */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer linking={linking} theme={navTheme}>
        {token == null ? (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
          </AuthStack.Navigator>
        ) : (
          // Nhánh đã đăng nhập: bọc ngoài bằng RootStackNavigator
          <RootStackNavigator />
        )}
      </NavigationContainer>
    </>
  );
}

function App(): React.JSX.Element {
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isUnlocked = useAuthStore((state) => state.isUnlocked);
  const setIsUnlocked = useAuthStore((state) => state.setIsUnlocked);
  const checkLocalToken = useAuthStore((state) => state.checkLocalToken);

  useEffect(() => {
    monitoring.setAttributes({ app_version: APP_VERSION, api_base_url: API_BASE_URL });
    monitoring.log(`ShopAI ${APP_VERSION} khởi động (${APP_ENV})`);
    checkLocalToken(); // Móc vào ổ cứng SecureStore ngay khi App vừa khởi chạy
  }, [checkLocalToken]);

  useEffect(() => {
    if (token == null) {
      setIsUnlocked(false);
      // Đăng xuất → xóa sạch cache Server State, tránh user sau thấy đơn hàng của user trước
      queryClient.clear();
    }
  }, [token, setIsUnlocked]);

  // Canh gác App Lock — tự đặt lại isUnlocked = false nếu App ở nền quá lâu (Phần 8.12)
  useAppLock({ setIsUnlocked });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Có token (đã đăng nhập từ trước) NHƯNG chưa vượt cổng -> chặn ở đây
  if (token != null && !isUnlocked) {
    return (
      <SafeAreaProvider>
        <BiometricGateScreen onUnlock={() => setIsUnlocked(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {/* Redux Provider chỉ phục vụ bài tập đề cương RTK (màn "Demo Redux Toolkit") */}
          <Provider store={reduxStore}>
            <ThemeProvider>
              <ThemedNavigation token={token} />
            </ThemeProvider>
          </Provider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

export default App;
