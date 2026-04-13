import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { SPRING_FAST, SIZES, RADII } from '@/constants/theme';

interface PillFilterProps<T extends string> {
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
  style?: object;
}

function PillItem<T extends string>({
  label,
  active,
  onPress,
}: {
  label: T;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, SPRING_FAST);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_FAST);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            height: SIZES.pillFilterHeight,
            borderRadius: RADII.pillFilter,
            backgroundColor: active ? colors.accent : colors.surface,
            borderWidth: active ? 0 : 1.5,
            borderColor: colors.separator,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
            marginRight: 8,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={{
            color: active ? '#111111' : colors.mutedText,
            fontWeight: active ? '700' : '500',
            fontSize: 14,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

export function PillFilter<T extends string>({
  options,
  selected,
  onSelect,
  style,
}: PillFilterProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {options.map((opt) => (
        <PillItem
          key={opt}
          label={opt}
          active={opt === selected}
          onPress={() => onSelect(opt)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: 'center',
  },
});
