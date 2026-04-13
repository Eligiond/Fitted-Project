import React, { useCallback } from 'react';
import { Image, View, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { WardrobeItem, CanvasItemLayout } from '@/types';
import { SPRING_FAST } from '@/constants/theme';

interface CanvasItemProps {
  item: WardrobeItem;
  layout: CanvasItemLayout;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLayoutChange: (id: string, layout: Partial<CanvasItemLayout>) => void;
  onRemove: (id: string) => void;
}

const BASE_SIZE = 140;

export const CanvasItemComponent: React.FC<CanvasItemProps> = ({
  item,
  layout,
  isSelected,
  onSelect,
  onLayoutChange,
  onRemove,
}) => {
  const { colors } = useTheme();

  const translateX = useSharedValue(layout.x);
  const translateY = useSharedValue(layout.y);
  const scale = useSharedValue(layout.scale ?? 1);
  const savedX = useSharedValue(layout.x);
  const savedY = useSharedValue(layout.y);
  const savedScale = useSharedValue(layout.scale ?? 1);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      runOnJS(onSelect)(item.id);
    })
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
      runOnJS(onLayoutChange)(item.id, {
        x: translateX.value,
        y: translateY.value,
      });
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.3, Math.min(3, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      runOnJS(onLayoutChange)(item.id, { scale: scale.value });
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: layout.zIndex,
  }));

  const handleSelect = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: BASE_SIZE,
            height: BASE_SIZE,
          },
          animatedStyle,
        ]}
      >
        <TouchableWithoutFeedback onPress={handleSelect}>
          <View style={{ width: BASE_SIZE, height: BASE_SIZE }}>
            <Image
              source={{ uri: item.frontImageUrl }}
              style={{ width: BASE_SIZE, height: BASE_SIZE }}
              resizeMode="contain"
            />

            {isSelected && (
              <>
                {/* Selection border */}
                <View
                  style={{
                    ...StyleSheet.flatten([
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderWidth: 2,
                        borderColor: colors.accent,
                        borderRadius: 8,
                        borderStyle: 'dashed',
                      },
                    ]),
                  }}
                />
                {/* Remove button */}
                <TouchableWithoutFeedback onPress={() => onRemove(item.id)}>
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: colors.destructive,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </View>
                </TouchableWithoutFeedback>
                {/* Resize handle */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="resize" size={12} color="#111" />
                </View>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </GestureDetector>
  );
};

// Need to import StyleSheet
import { StyleSheet } from 'react-native';
