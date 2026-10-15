import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ShopButton from '../src/components/ui/ShopButton';

describe('<ShopButton /> — RNTL', () => {
  it('hiển thị tiêu đề và gọi onPress khi bấm', () => {
    const onPress = jest.fn();
    render(<ShopButton title="Mua ngay" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Mua ngay' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled → không gọi onPress', () => {
    const onPress = jest.fn();
    render(<ShopButton title="Thanh toán" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button', { name: 'Thanh toán' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('isLoading → ẩn chữ, hiện vòng xoay và chặn bấm đúp', () => {
    const onPress = jest.fn();
    render(<ShopButton title="Đặt hàng" onPress={onPress} isLoading />);

    expect(screen.queryByText('Đặt hàng')).toBeNull();
    expect(screen.getByTestId('shop-button-loading')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('accessibilityLabel mặc định lấy theo title (cho TalkBack/VoiceOver)', () => {
    render(<ShopButton title="Thêm vào giỏ" variant="outline" onPress={jest.fn()} />);
    expect(screen.getByLabelText('Thêm vào giỏ')).toBeTruthy();
  });
});
