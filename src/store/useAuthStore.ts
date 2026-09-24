import { create } from 'zustand';

interface AuthState {
  token: string | null;
  login: (newToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null, // Khởi tạo chưa đăng nhập
  login: (newToken) => {
    // Ở chương sau (Chương 8) ta sẽ lưu token này vào Ổ cứng Keystore tại đây
    set({ token: newToken });
  },
  logout: () => set({ token: null }),
}));