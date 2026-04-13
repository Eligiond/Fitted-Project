import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/constants/firebase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PillFilter } from '@/components/ui/PillFilter';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { MasonryGrid } from '@/components/wardrobe/MasonryGrid';
import { UploadModal, UploadModalHandle } from '@/components/wardrobe/UploadModal';
import { WardrobeItem, WardrobeCategory, WARDROBE_CATEGORIES } from '@/types';
import { SPRING_FAST, SIZES } from '@/constants/theme';

export default function WardrobeScreen() {
  const { colors } = useTheme();
  const { user, appUser } = useAuth();
  const insets = useSafeAreaInsets();
  const uploadRef = useRef<UploadModalHandle>(null);

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<WardrobeCategory>('All');

  // Pulsing animation for empty state
  const emptyPulse = useSharedValue(1);
  useEffect(() => {
    emptyPulse.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900 }),
        withTiming(0.95, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);
  const emptyPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emptyPulse.value }],
  }));

  // FAB rotation on press
  const fabRotation = useSharedValue(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'wardrobe_items'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const fetched: WardrobeItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<WardrobeItem, 'id'>),
      }));
      setItems(fetched);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const filteredItems =
    category === 'All' ? items : items.filter((i) => i.category === category);

  const handleDelete = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await deleteDoc(doc(db, 'wardrobe_items', id));
    // Optionally delete storage files
  }, [items]);

  const handleFABPress = useCallback(() => {
    fabRotation.value = withSequence(
      withSpring(45, SPRING_FAST),
      withSpring(0, SPRING_FAST)
    );
    uploadRef.current?.open();
  }, []);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.wordmark, { color: colors.primaryText }]}>Fitted</Text>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <AnimatedButton
            variant="icon"
            icon={<Ionicons name="search-outline" size={20} color={colors.primaryText} />}
            onPress={() => {}}
          />
          <TouchableWithoutFeedback onPress={() => router.push('/profile/me')}>
            <View
              style={[
                styles.avatar,
                { borderColor: colors.accent, backgroundColor: colors.surface },
              ]}
            >
              {appUser?.avatarUrl ? (
                <Image source={{ uri: appUser.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={18} color={colors.mutedText} />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>

      {/* Filter pills */}
      <PillFilter
        options={WARDROBE_CATEGORIES}
        selected={category}
        onSelect={setCategory}
        style={{ paddingVertical: 12 }}
      />

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: SIZES.navHeight + SIZES.navBottom + insets.bottom + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!loading && filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Animated.View style={emptyPulseStyle}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="add" size={36} color="#111111" />
              </View>
            </Animated.View>
            <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>
              {category === 'All' ? 'Add your first piece.' : `No ${category} yet.`}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
              Tap the + button to start building your wardrobe
            </Text>
          </View>
        ) : (
          <MasonryGrid
            items={filteredItems}
            onItemDelete={handleDelete}
            onItemAddToOutfit={(id) => {}}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <View
        style={[
          styles.fabContainer,
          { bottom: SIZES.navHeight + SIZES.navBottom + insets.bottom + 16 },
        ]}
      >
        <AnimatedButton
          variant="fab"
          onPress={handleFABPress}
          icon={
            <Animated.View style={fabStyle}>
              <Ionicons name="add" size={28} color="#111111" />
            </Animated.View>
          }
        />
      </View>

      {/* Upload Modal */}
      <UploadModal ref={uploadRef} onSaved={() => {}} />
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
    paddingBottom: 8,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContent: {
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyIcon: {
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
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
  },
});
