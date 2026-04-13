import React, { useCallback } from 'react';
import {
  StyleSheet,
  StyleProp,
  Text,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { SPRING_FAST, RADII, SIZES } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'pill' | 'fab' | 'destructive';

interface AnimatedButtonProps {
  variant?: ButtonVariant;
  onPress?: () => void;
  label?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  active?: boolean;
  hitSlop?: number;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  onPress,
  label,
  icon,
  children,
  disabled = false,
  loading = false,
  style,
  textStyle,
  active = false,
  hitSlop = 8,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, SPRING_FAST);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_FAST);
  }, []);

  const handlePress = useCallback(() => {
    if (onPress && !disabled && !loading) onPress();
  }, [onPress, disabled, loading]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {};
    switch (variant) {
      case 'primary':
        return {
          ...base,
          height: SIZES.buttonHeight,
          borderRadius: RADII.button,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.45 : 1,
        };
      case 'secondary':
        return {
          ...base,
          height: SIZES.buttonHeight,
          borderRadius: RADII.button,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.45 : 1,
        };
      case 'destructive':
        return {
          ...base,
          height: SIZES.buttonHeight,
          borderRadius: RADII.button,
          backgroundColor: colors.destructive,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.45 : 1,
        };
      case 'icon':
        return {
          ...base,
          width: SIZES.iconButton,
          height: SIZES.iconButton,
          borderRadius: SIZES.iconButton / 2,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        };
      case 'fab':
        return {
          ...base,
          width: SIZES.fabSize,
          height: SIZES.fabSize,
          borderRadius: SIZES.fabSize / 2,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        };
      case 'pill':
        return {
          ...base,
          height: SIZES.pillFilterHeight,
          borderRadius: RADII.pillFilter,
          backgroundColor: active ? colors.accent : colors.surface,
          borderWidth: active ? 0 : 1.5,
          borderColor: colors.separator,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: '#111111', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 };
      case 'secondary':
        return { color: colors.primaryText, fontWeight: '600', fontSize: 16, letterSpacing: 0.2 };
      case 'destructive':
        return { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 };
      case 'pill':
        return {
          color: active ? '#111111' : colors.mutedText,
          fontWeight: active ? '600' : '500',
          fontSize: 14,
          letterSpacing: 0.1,
        };
      default:
        return { color: colors.primaryText, fontWeight: '600', fontSize: 16 };
    }
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      hitSlop={hitSlop}
    >
      <Animated.View style={[getContainerStyle(), animatedStyle, style]}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' || variant === 'fab' ? '#111111' : colors.primaryText}
            size="small"
          />
        ) : (
          <>
            {icon}
            {label ? <Text style={[getTextStyle(), textStyle]}>{label}</Text> : null}
            {children}
          </>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
