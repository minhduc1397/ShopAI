// src/contexts/ThemeContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@constants/theme';

const LIGHT_COLORS = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textLight: COLORS.textLight,
  border: COLORS.border,
  primary: COLORS.primary,
  primarySoft: COLORS.primarySoft,
};

// Bộ màu Tối — đổi nền/chữ/viền; primary sáng hơn một chút để đủ tương phản trên nền tối
const DARK_COLORS: typeof LIGHT_COLORS = {
  background: '#0B0D17',
  surface: '#161A2B',
  text: '#F3F4F6',
  textLight: '#9CA3AF',
  border: '#262B40',
  primary: '#818CF8',
  primarySoft: '#1E1B4B',
};

export type ThemeColors = typeof LIGHT_COLORS;

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'shopai-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  // Nhớ lựa chọn Sáng/Tối qua các lần mở app
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setIsDark(saved === 'dark'))
      .catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      toggleTheme: () =>
        setIsDark((prev) => {
          const next = !prev;
          AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light').catch(() => undefined);
          return next;
        }),
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải được gọi bên trong <ThemeProvider>');
  return ctx;
};
