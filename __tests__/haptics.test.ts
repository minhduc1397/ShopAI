import { Platform, Vibration } from 'react-native';
import {
  hapticError,
  hapticLight,
  hapticMedium,
  hapticSuccess,
  setHapticsEnabled,
} from '../src/utils/haptics';

describe('haptics — rung phản hồi an toàn', () => {
  const vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);

  beforeEach(() => {
    vibrate.mockClear();
    setHapticsEnabled(true);
  });

  it('mỗi kiểu rung gọi Vibration với đúng mẫu', () => {
    hapticLight();
    hapticMedium();
    hapticError();
    expect(vibrate).toHaveBeenNthCalledWith(1, 20);
    expect(vibrate).toHaveBeenNthCalledWith(2, 40);
    expect(vibrate).toHaveBeenNthCalledWith(3, [0, 60, 80, 60, 80, 60]);
  });

  it('rung "thành công": Android 2 nhịp, iOS 1 nhịp', () => {
    const original = Platform.OS;
    Platform.OS = 'android';
    hapticSuccess();
    Platform.OS = 'ios';
    hapticSuccess();
    Platform.OS = original;
    expect(vibrate).toHaveBeenNthCalledWith(1, [0, 30, 60, 30]);
    expect(vibrate).toHaveBeenNthCalledWith(2, 1);
  });

  it('tắt rung trong tab Tài khoản → không rung nữa', () => {
    setHapticsEnabled(false);
    hapticMedium();
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('máy không có motor rung → nuốt lỗi, không làm sập app', () => {
    vibrate.mockImplementationOnce(() => {
      throw new Error('no vibrator');
    });
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(() => hapticLight()).not.toThrow();
    log.mockRestore();
  });
});
