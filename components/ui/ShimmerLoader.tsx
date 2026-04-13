import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

interface ShimmerLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width: w = width - 40,
  height: h = 200,
  borderRadius = 16,
  style,
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(-w);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(w, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [w]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const baseColor = colors.surface === '#ffffff' ? '#e0e0e0' : '#2c2c2c';
  const highlightColor = colors.surface === '#ffffff' ? '#f5f5f5' : '#3a3a3a';

  return (
    <View
      style={[
        {
          width: w,
          height: h,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            highlightColor,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: w * 0.7, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

interface ShimmerCardProps {
  style?: ViewStyle;
}

export const ShimmerCard: React.FC<ShimmerCardProps> = ({ style }) => {
  return (
    <View style={[{ padding: 16, gap: 12 }, style]}>
      <ShimmerLoader height={220} borderRadius={20} />
      <ShimmerLoader height={16} width={160} borderRadius={8} />
      <ShimmerLoader height={12} width={100} borderRadius={6} />
    </View>
  );
};
