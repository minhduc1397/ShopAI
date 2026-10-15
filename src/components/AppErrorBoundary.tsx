import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SIZES } from '@constants/theme';
import { monitoring } from '@services/monitoring';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Lưới an toàn cuối cùng: một màn hình render lỗi không được biến cả App thành màn trắng.
 * Lỗi được ghi về monitoring (Crashlytics khi đã cấu hình) rồi cho người dùng thử lại.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    monitoring.log(`ErrorBoundary: ${info.componentStack?.split('\n')[1]?.trim() ?? ''}`);
    monitoring.recordError(error, 'RenderCrash');
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🛠️</Text>
        <Text style={styles.title}>Ối, ShopAI vừa gặp sự cố</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
        <Pressable style={styles.button} onPress={this.reset} accessibilityRole="button">
          <Text style={styles.buttonText}>Thử lại</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
  },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: SIZES.h2, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  message: { color: COLORS.textLight, textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
  },
  buttonText: { color: COLORS.white, fontWeight: '700' },
});
