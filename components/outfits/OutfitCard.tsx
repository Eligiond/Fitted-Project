import React, { useCallback, useEffect } from 'react';
import { View, Text, Image, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Outfit, WardrobeItem } from '@/types';
import { SPRING_FAST, SPRING_SOFT, RADII } from '@/constants/theme';

interface OutfitCardProps {
  outfit: Outfit;
  wardrobeItems: WardrobeItem[];
  onPress?: () => void;
  enterDelay?: number;
  width?: number;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  wardrobeItems,
  onPress,
  enterDelay = 0,
  width = 160,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(enterDelay, withTiming(1, { duration: 250 }));
    scale.value = withDelay(enterDelay, withSpring(1, SPRING_SOFT));
  }, [enterDelay]);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.95, SPRING_FAST);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING_FAST);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
    opacity: opacity.value,
  }));

  // Show up to 4 items as overlapping collage
  const previewItems = wardrobeItems
    .filter((wi) => outfit.itemIds.includes(wi.id))
    .slice(0, 4);

  const cardHeight = width * 1.2;

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            width,
            borderRadius: RADII.cardLarge,
            backgroundColor: colors.surface,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.cardBorder,
          },
          cardStyle,
        ]}
      >
        {/* Collage / cover */}
        <View style={{ height: cardHeight, backgroundColor: colors.background }}>
          {outfit.coverImageUrl ? (
            <Image
              source={{ uri: outfit.coverImageUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <CollagePreview items={previewItems} height={cardHeight} colors={colors} />
          )}
        </View>

        <View style={{ padding: 12 }}>
          <Text
            style={{
              color: colors.primaryText,
              fontWeight: '700',
              fontSize: 14,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {outfit.name || 'Untitled Outfit'}
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
            {outfit.itemIds.length} piece{outfit.itemIds.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const CollagePreview: React.FC<{
  items: WardrobeItem[];
  height: number;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ items, height, colors }) => {
  if (items.length === 0) {
    return (
      <View style={[StyleSheet.absoluteFillObject, styles.emptyCollage]}>
        <Ionicons name="layers-outline" size={32} color={colors.mutedText} />
      </View>
    );
  }

  const positions = [
    { top: '5%', left: '10%', size: '55%', rotate: '-8deg', zIndex: 1 },
    { top: '15%', right: '5%', size: '50%', rotate: '6deg', zIndex: 2 },
    { bottom: '5%', left: '20%', size: '45%', rotate: '-4deg', zIndex: 3 },
    { bottom: '10%', right: '15%', size: '40%', rotate: '10deg', zIndex: 4 },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {items.slice(0, 4).map((item, i) => {
        const pos = positions[i];
        return (
          <Image
            key={item.id}
            source={{ uri: item.frontImageUrl }}
            style={[
              {
                position: 'absolute',
                width: pos.size as unknown as number,
                height: pos.size as unknown as number,
                zIndex: pos.zIndex,
                ...(pos.top !== undefined ? { top: pos.top as unknown as number } : {}),
                ...(pos.bottom !== undefined ? { bottom: pos.bottom as unknown as number } : {}),
                ...(pos.left !== undefined ? { left: pos.left as unknown as number } : {}),
                ...(pos.right !== undefined ? { right: pos.right as unknown as number } : {}),
              },
            ]}
            resizeMode="contain"
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCollage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
