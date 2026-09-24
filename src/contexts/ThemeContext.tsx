// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { COLORS } from "@constants/theme";

// Bộ màu Sáng lấy thẳng từ theme.ts (giữ đúng bộ nhận diện thương hiệu ShopAI hiện có)
const LIGHT_COLORS = {
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textLight: COLORS.textLight,
  primary: COLORS.primary,
};

// Bộ màu Tối — chỉ đổi nền/chữ, GIỮ NGUYÊN `primary` (màu thương hiệu không nên đổi theo Theme)
const DARK_COLORS = {
  background: "#121212",
  surface: "#1E1E1E",
  text: "#F5F5F5",
  textLight: "#9BA1A6",
  primary: COLORS.primary,
};

interface ThemeContextValue {
  isDark: boolean;
  colors: typeof LIGHT_COLORS;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const value: ThemeContextValue = {
    isDark,
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    toggleTheme: () => setIsDark((prev) => !prev),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme phải được gọi bên trong <ThemeProvider>");
  return ctx;
};