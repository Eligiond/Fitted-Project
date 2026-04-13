import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { db } from '@/constants/firebase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PillFilter } from '@/components/ui/PillFilter';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { FeedCard } from '@/components/social/FeedCard';
import { SocialPost } from '@/types';
import { SIZES } from '@/constants/theme';

type FeedFilter = 'For You' | 'Friends' | 'Trending';
const FEED_FILTERS: FeedFilter[] = ['For You', 'Friends', 'Trending'];

export default function FeedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<FeedFilter>('For You');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'social_posts'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SocialPost, 'id'>),
        }))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <FeedCard post={item} onUserPress={handleUserPress} />
        )}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <Text style={[styles.title, { color: colors.primaryText }]}>Community</Text>
              <View style={styles.headerRight}>
                <ThemeToggle />
                <AnimatedButton
                  variant="icon"
                  icon={<Ionicons name="notifications-outline" size={20} color={colors.primaryText} />}
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* Filters */}
            <PillFilter
              options={FEED_FILTERS}
              selected={filter}
              onSelect={setFilter}
              style={{ paddingVertical: 12 }}
            />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.primaryText }]}>
                No posts yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                Be the first to share your style with the community
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: SIZES.navHeight + SIZES.navBottom + insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.cardSeparator, { backgroundColor: colors.separator }]} />
        )}
      />
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
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
  cardSeparator: {
    height: 1,
    marginVertical: 4,
  },
});
