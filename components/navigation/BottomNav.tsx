import React, { useEffect, useCallback } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { SPRING_BOUNCY, SPRING_FAST, SIZES } from '@/constants/theme';

type TabConfig = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const TABS: TabConfig[] = [
  { name: 'wardrobe', icon: 'shirt-outline', activeIcon: 'shirt', label: 'Wardrobe' },
  { name: 'outfits', icon: 'layers-outline', activeIcon: 'layers', label: 'Outfits' },
  { name: 'planner', icon: 'calendar-outline', activeIcon: 'calendar', label: 'Plan' },
  { name: 'feed', icon: 'people-outline', activeIcon: 'people', label: 'Community' },
];

const TabIcon: React.FC<{
  config: TabConfig;
  focused: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ config, focused, onPress, colors }) => {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.18, SPRING_BOUNCY);
      dotOpacity.value = withSpring(1, SPRING_FAST);
    } else {
      scale.value = withSpring(1, SPRING_FAST);
      dotOpacity.value = withSpring(0, SPRING_FAST);
    }
  }, [focused]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, SPRING_FAST);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(focused ? 1.18 : 1, SPRING_BOUNCY);
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <View style={styles.tabItem}>
        <Animated.View style={iconStyle}>
          <Ionicons
            name={focused ? config.activeIcon : config.icon}
            size={24}
            color={focused ? colors.accent : colors.mutedText}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: colors.accent },
            dotStyle,
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export const BottomNav: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom + 8, SIZES.navBottom) },
      ]}
    >
      <BlurView
        intensity={85}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.pill,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            backgroundColor: isDark ? 'rgba(28,28,28,0.7)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const config = TABS.find((t) => t.name === route.name);
          if (!config) return null;
          const focused = state.index === index;
          return (
            <TabIcon
              key={route.key}
              config={config}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              colors={colors}
            />
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  pill: {
    flexDirection: 'row',
    height: SIZES.navHeight,
    borderRadius: SIZES.navHeight / 2,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
