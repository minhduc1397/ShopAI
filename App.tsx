// App.tsx
import React from 'react';
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
import { useAuthStore } from '@store/useAuthStore';

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