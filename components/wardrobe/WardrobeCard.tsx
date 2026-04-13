import React, { useCallback, useState } from 'react';
import {
  View,
  Image,
  Text,
  TouchableWithoutFeedback,
  Alert,
  StyleSheet,
} from 'react-native';
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
import { WardrobeItem } from '@/types';
import { SPRING_FAST, SPRING_SOFT, RADII } from '@/constants/theme';

interface WardrobeCardProps {
  item: WardrobeItem;
  width: number;
  enterDelay?: number;
  onPress?: () => void;
  onDelete?: (id: string) => void;
  onAddToOutfit?: (id: string) => void;
}

export const WardrobeCard: React.FC<WardrobeCardProps> = ({
  item,
  width,
  enterDelay = 0,
  onPress,
  onDelete,
  onAddToOutfit,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const [menuVisible, setMenuVisible] = useState(false);

  React.useEffect(() => {
    opacity.value = withDelay(enterDelay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(enterDelay, withSpring(1, SPRING_SOFT));
  }, [enterDelay]);

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.95, SPRING_FAST);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING_FAST);
  }, []);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(item.category, undefined, [
      {
        text: 'Add to Outfit',
        onPress: () => onAddToOutfit?.(item.id),
      },
      {
        text: 'View Back',
        onPress: () => {},
        style: 'default',
      },
      {
        text: 'Delete',
        onPress: () => onDelete?.(item.id),
        style: 'destructive',
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [item]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
    opacity: opacity.value,
  }));

  // Vary card height by category/index for masonry feel
  const cardHeight = getCardHeight(item);

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={450}
    >
      <Animated.View
        style={[
          {
            width,
            backgroundColor: colors.surface,
            borderRadius: RADII.card,
            overflow: 'hidden',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          },
          cardStyle,
        ]}
      >
        <View style={{ height: cardHeight, backgroundColor: colors.background }}>
          <Image
            source={{ uri: item.frontImageUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
          />
        </View>
        <View style={{ padding: 12 }}>
          <Text
            style={{
              color: colors.primaryText,
              fontWeight: '600',
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            {item.category}
          </Text>
          {item.tags.length > 0 && (
            <Text
              style={{
                color: colors.mutedText,
                fontSize: 12,
                lineHeight: 16,
              }}
              numberOfLines={1}
            >
              {item.tags.join(' · ')}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

function getCardHeight(item: WardrobeItem): number {
  const heights: Record<string, number> = {
    Tops: 180,
    Bottoms: 200,
    Shoes: 150,
    Accessories: 140,
    Outerwear: 220,
    All: 180,
  };
  return heights[item.category] ?? 180;
}
