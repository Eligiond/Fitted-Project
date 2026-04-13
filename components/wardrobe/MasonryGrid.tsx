import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { WardrobeItem } from '@/types';
import { WardrobeCard } from './WardrobeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 20;
const GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP) / 2;

interface MasonryGridProps {
  items: WardrobeItem[];
  onItemPress?: (item: WardrobeItem) => void;
  onItemDelete?: (id: string) => void;
  onItemAddToOutfit?: (id: string) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  items,
  onItemPress,
  onItemDelete,
  onItemAddToOutfit,
}) => {
  const leftItems = items.filter((_, i) => i % 2 === 0);
  const rightItems = items.filter((_, i) => i % 2 !== 0);

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        {leftItems.map((item, i) => (
          <WardrobeCard
            key={item.id}
            item={item}
            width={CARD_WIDTH}
            enterDelay={i * 60}
            onPress={() => onItemPress?.(item)}
            onDelete={onItemDelete}
            onAddToOutfit={onItemAddToOutfit}
          />
        ))}
      </View>
      <View style={[styles.column, { marginTop: 28 }]}>
        {rightItems.map((item, i) => (
          <WardrobeCard
            key={item.id}
            item={item}
            width={CARD_WIDTH}
            enterDelay={i * 60 + 30}
            onPress={() => onItemPress?.(item)}
            onDelete={onItemDelete}
            onAddToOutfit={onItemAddToOutfit}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  column: {
    flex: 1,
  },
});
