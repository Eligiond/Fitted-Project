import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { OutfitCard } from '@/components/outfits/OutfitCard';
import { Outfit, WardrobeItem } from '@/types';
import { SIZES } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

export default function OutfitsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const emptyPulse = useSharedValue(1);
  useEffect(() => {
    emptyPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(0.95, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);
  const emptyPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emptyPulse.value }],
  }));

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'outfits'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOutfits(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Outfit, 'id'>) })));
      setLoading(false);
    });
    const q2 = query(collection(db, 'wardrobe_items'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      setWardrobeItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WardrobeItem, 'id'>) })));
    });
    return () => { unsub(); unsub2(); };
  }, [user]);

  const handleNewOutfit = useCallback(() => {
    router.push('/canvas/new');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.primaryText }]}>My Outfits</Text>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <AnimatedButton
            variant="icon"
            icon={<Ionicons name="add" size={22} color={colors.primaryText} />}
            onPress={handleNewOutfit}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SIZES.navHeight + SIZES.navBottom + insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!loading && outfits.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.View style={emptyPulseStyle}>
              <View style={[styles.emptyIconBg, { backgroundColor: colors.accent }]}>
                <Ionicons name="layers" size={36} color="#111" />
              </View>
            </Animated.View>
            <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>
              Build your first outfit.
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
              Combine pieces from your wardrobe into a look
            </Text>
            <AnimatedButton
              variant="primary"
              label="Create Outfit"
              icon={<Ionicons name="add" size={20} color="#111" />}
              onPress={handleNewOutfit}
              style={styles.createButton}
            />
          </View>
        ) : (
          <View style={styles.grid}>
            {outfits.map((outfit, i) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                wardrobeItems={wardrobeItems}
                width={CARD_WIDTH}
                enterDelay={i * 50}
                onPress={() => router.push(`/canvas/${outfit.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
