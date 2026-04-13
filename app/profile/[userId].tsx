import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { WardrobeItem, AppUser, Outfit } from '@/types';
import { SPRING_FAST, SPRING_BOUNCY } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = (SCREEN_WIDTH - 20 * 2 - 4) / 3;

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const followScale = useSharedValue(1);
  const followStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  useEffect(() => {
    if (!userId) return;

    getDoc(doc(db, 'users', userId)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Omit<AppUser, 'uid'>;
      setProfileUser({ uid: snap.id, ...data });
      if (user && (data.followers as string[] | undefined)?.includes(user.uid)) {
        setIsFollowing(true);
      }
    });

    const q = query(collection(db, 'wardrobe_items'), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      setWardrobeItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WardrobeItem, 'id'>) }))
      );
    });

    const q2 = query(collection(db, 'outfits'), where('userId', '==', userId));
    const unsub2 = onSnapshot(q2, (snap) => {
      setOutfits(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Outfit, 'id'>) }))
      );
    });

    return () => {
      unsub();
      unsub2();
    };
  }, [userId, user]);

  const handleFollow = async () => {
    if (!user || !profileUser) return;

    followScale.value = withSequence(
      withSpring(1.22, SPRING_BOUNCY),
      withSpring(1, SPRING_FAST)
    );

    const nowFollowing = !isFollowing;
    setIsFollowing(nowFollowing);

    try {
      await Promise.all([
        updateDoc(doc(db, 'users', profileUser.uid), {
          followers: nowFollowing ? arrayUnion(user.uid) : arrayRemove(user.uid),
        }),
        updateDoc(doc(db, 'users', user.uid), {
          following: nowFollowing ? arrayUnion(profileUser.uid) : arrayRemove(profileUser.uid),
        }),
      ]);
    } catch {
      setIsFollowing(!nowFollowing); // revert optimistic update
    }
  };

  const isOwnProfile = user && userId === user.uid;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedButton
          variant="icon"
          icon={<Ionicons name="arrow-back" size={20} color={colors.primaryText} />}
          onPress={() => router.back()}
        />
        <Text style={[styles.headerTitle, { color: colors.primaryText }]} numberOfLines={1}>
          {profileUser?.handle ?? ''}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarBorder, { borderColor: colors.accent }]}>
            {profileUser?.avatarUrl ? (
              <Image source={{ uri: profileUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="person" size={40} color={colors.mutedText} />
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.displayName, { color: colors.primaryText }]}>
            {profileUser?.displayName ?? 'Fitted User'}
          </Text>
          <Text style={[styles.handle, { color: colors.mutedText }]}>
            {profileUser?.handle ?? '@user'}
          </Text>
          {profileUser?.bio ? (
            <Text style={[styles.bio, { color: colors.primaryText }]}>{profileUser.bio}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <ProfileStats
          itemCount={wardrobeItems.length}
          outfitCount={outfits.length}
          followerCount={(profileUser?.followers as string[] | undefined)?.length ?? 0}
        />

        {/* Follow / Edit Profile button */}
        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <AnimatedButton
              variant="secondary"
              label="Edit Profile"
              style={{ flex: 1 }}
              onPress={() => router.push('/settings')}
            />
          ) : (
            <Animated.View style={[{ flex: 1 }, followStyle]}>
              <AnimatedButton
                variant={isFollowing ? 'secondary' : 'primary'}
                label={isFollowing ? 'Following' : 'Follow'}
                style={{ flex: 1 }}
                onPress={handleFollow}
              />
            </Animated.View>
          )}
        </View>

        {/* Wardrobe grid */}
        <View style={styles.grid}>
          {wardrobeItems.length === 0 ? (
            <Text style={[styles.emptyGrid, { color: colors.mutedText }]}>No items yet</Text>
          ) : (
            wardrobeItems.map((item) => (
              <GridItem key={item.id} uri={item.frontImageUrl} colors={colors} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const GridItem: React.FC<{
  uri: string;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ uri, colors }) => {
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableWithoutFeedback
      onPressIn={() => { scale.value = withSpring(0.95, SPRING_FAST); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_FAST); }}
      onPress={() => {}}
    >
      <Animated.View
        style={[
          {
            width: GRID_ITEM,
            height: GRID_ITEM,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.surface,
          },
          s,
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name="image-outline" size={24} color={colors.mutedText} />
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  scrollContent: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 16, marginBottom: 16 },
  avatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    overflow: 'hidden',
    padding: 2,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 44 },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: { alignItems: 'center', marginBottom: 16, paddingHorizontal: 32 },
  displayName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  handle: { fontSize: 15, fontWeight: '500', marginBottom: 8 },
  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', opacity: 0.8 },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 2,
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGrid: {
    padding: 32,
    textAlign: 'center',
    fontSize: 15,
    width: '100%',
  },
});
