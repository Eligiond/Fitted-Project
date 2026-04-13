import React, { useEffect, useCallback } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { SPRING_FAST, SPRING_BOUNCY, SIZES } from '@/constants/theme';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(isDark ? 180 : 0, SPRING_BOUNCY);
  }, [isDark]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, SPRING_FAST);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_FAST);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  }, [toggleTheme]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          {
            width: SIZES.iconButton,
            height: SIZES.iconButton,
            borderRadius: SIZES.iconButton / 2,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={20}
            color={isDark ? colors.accent : '#f59e0b'}
          />
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
