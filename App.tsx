// App.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { reduxStore } from '@store/redux/store';
import { ThemeProvider } from '@contexts/ThemeContext';
import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';
import RootStackNavigator from '@navigation/RootStackNavigator';
import BiometricGateScreen from '@screens/BiometricGateScreen';
import { useAuthStore } from '@store/useAuthStore';
import { useAppLock } from '@hooks/useAppLock';
import { COLORS } from '@constants/theme';

const AuthStack = createNativeStackNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu giữ trạng thái tươi trong 5 phút
      retry: 2,
    },
  },
});

// Cấu hình Deep Linking
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
        },
      },
    },
  },
};

function App(): React.JSX.Element {
  const token = useAuthStore(state => state.token);
  const isLoading = useAuthStore(state => state.isLoading);
  const isUnlocked = useAuthStore(state => state.isUnlocked);
  const setIsUnlocked = useAuthStore(state => state.setIsUnlocked);
  const checkLocalToken = useAuthStore(state => state.checkLocalToken);

  useEffect(() => {
    checkLocalToken(); // Móc vào ổ cứng SecureStore ngay khi App vừa khởi chạy
  }, [checkLocalToken]);

  useEffect(() => {
    if (token == null) {
      setIsUnlocked(false);
    }
  }, [token, setIsUnlocked]);

  // Canh gác App Lock — tự đặt lại isUnlocked = false nếu App ở nền quá lâu (Phần 8.12)
  useAppLock({ isUnlocked, setIsUnlocked });

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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {/* Bọc Redux Provider ở tầng ngoài ThemeProvider để toàn bộ màn hình đều truy cập được Redux Store */}
        <Provider store={reduxStore}>
          <ThemeProvider>
            <NavigationContainer linking={linking}>
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
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;