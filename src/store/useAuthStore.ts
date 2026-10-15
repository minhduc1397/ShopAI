import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  isLoading: boolean; // Trạng thái đang kiểm tra ổ cứng
  isUnlocked: boolean; // Trạng thái đã vượt cổng sinh trắc học
  login: (newToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkLocalToken: () => Promise<void>; // Hàm chạy lúc mở app
  setIsUnlocked: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLoading: true, // Mặc định vừa vào app là Loading
  isUnlocked: false,

  // Lưu token vào RAM (Đám mây) VÀ lưu xuống Ổ cứng mã hóa (Keystore)
  // Đăng nhập lần đầu bằng mật khẩu -> coi như đã mở khoá phiên này
  login: async (newToken) => {
    await SecureStore.setItemAsync('SHOP_ACCESS_TOKEN', newToken);
    set({ token: newToken, isUnlocked: true });
  },

  // Hủy Token trên cả 2 nơi và khoá lại
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('SHOP_ACCESS_TOKEN');
    } catch (e) {
      console.log('Lỗi xoá SecureStore:', e);
    }
    set({ token: null, isUnlocked: false });
  },

  // Hàm móc dữ liệu từ Keystore lên khi người dùng vừa khởi động lại điện thoại
  checkLocalToken: async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('SHOP_ACCESS_TOKEN');
      console.log('[useAuthStore] checkLocalToken storedToken:', storedToken);
      if (storedToken) {
        // Tìm thấy Token -> set token, nhưng isUnlocked = false để bắt xác thực sinh trắc học
        set({ token: storedToken, isUnlocked: false });
      }
    } catch (e) {
      console.log('Lỗi Keystore:', e);
    } finally {
      set({ isLoading: false }); // Kiểm tra xong, tắt vòng xoay Loading
    }
  },

  setIsUnlocked: (value: boolean) => set({ isUnlocked: value }),
}));
