// src/components/ui/ShopButton.tsx
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Typography from '@components/ui/Typography';
import { COLORS, SIZES } from '@constants/theme';

export type ShopButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

interface ShopButtonProps {
  title: string;
  onPress: () => void;
  variant?: ShopButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

// Mỗi variant = màu nền + màu chữ + viền. Thêm variant mới chỉ cần thêm 1 dòng ở đây.
const VARIANTS: Record<ShopButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.white, border: COLORS.primary },
  outline: { bg: 'transparent', fg: COLORS.primary, border: COLORS.primary },
  ghost: { bg: COLORS.primarySoft, fg: COLORS.primary, border: COLORS.primarySoft },
  danger: { bg: COLORS.danger, fg: COLORS.white, border: COLORS.danger },
};

const ShopButton: React.FC<ShopButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const palette = VARIANTS[variant];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        variant === 'primary' && styles.raised,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      // Không truyền riêng thì mặc định lấy luôn `title` — VoiceOver/TalkBack luôn có tên nút để đọc
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator testID="shop-button-loading" color={palette.fg} />
      ) : (
        <Typography
          variant="body1"
          color={disabled ? COLORS.textLight : palette.fg}
          style={[styles.label, textStyle]}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    width: '100%',
  },
  raised: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontWeight: '700' },
  disabledButton: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default memo(ShopButton);
