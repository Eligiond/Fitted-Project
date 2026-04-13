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
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { WardrobeItem, Outfit } from '@/types';
import { SPRING_FAST, SIZES, RADII } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = (SCREEN_WIDTH - 20 * 2 - 4) / 3;

type ProfileTab = 'Wardrobe' | 'Outfits';
const PROFILE_TABS: ProfileTab[] = ['Wardrobe', 'Outfits'];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, appUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<ProfileTab>('Wardrobe');
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  const tabSlide = useSharedValue(0);
  const tabSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabSlide.value }],
  }));

  const switchTab = (tab: ProfileTab) => {
    const targetX = tab === 'Wardrobe' ? 0 : (SCREEN_WIDTH - 40) / 2;
    tabSlide.value = withSpring(targetX, SPRING_FAST);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'wardrobe_items'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setWardrobeItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WardrobeItem, 'id'>) })));
    });
    const q2 = query(collection(db, 'outfits'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      setOutfits(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Outfit, 'id'>) })));
    });
    return () => { unsub(); unsub2(); };
  }, [user]);

  const gridItems = activeTab === 'Wardrobe' ? wardrobeItems : outfits;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 44 }} />
        <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Profile</Text>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <AnimatedButton
            variant="icon"
            icon={<Ionicons name="settings-outline" size={20} color={colors.primaryText} />}
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SIZES.navHeight + SIZES.navBottom + insets.bottom + 40 },
        ]}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarBorder, { borderColor: colors.accent }]}>
            {appUser?.avatarUrl ? (
              <Image source={{ uri: appUser.avatarUrl }} style={styles.avatarImage} />
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
            {appUser?.displayName ?? 'Fitted User'}
          </Text>
          <Text style={[styles.handle, { color: colors.mutedText }]}>
            {appUser?.handle ?? '@user'}
          </Text>
          {appUser?.bio ? (
            <Text style={[styles.bio, { color: colors.primaryText }]}>{appUser.bio}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <ProfileStats
          itemCount={wardrobeItems.length}
          outfitCount={outfits.length}
          followerCount={appUser?.followers.length ?? 0}
        />

        {/* Edit Profile */}
        <View style={styles.actionButtons}>
          <AnimatedButton
            variant="secondary"
            label="Edit Profile"
            style={{ flex: 1 }}
            onPress={() => router.push('/settings')}
          />
        </View>

        {/* Tab pills */}
        <View style={[styles.tabRow, { borderBottomColor: colors.separator }]}>
          {PROFILE_TABS.map((tab) => (
            <TouchableWithoutFeedback key={tab} onPress={() => switchTab(tab)}>
              <View style={styles.tabItem}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab ? colors.primaryText : colors.mutedText,
                      fontWeight: activeTab === tab ? '700' : '500',
                    },
                  ]}
                >
                  {tab}
                </Text>
                {activeTab === tab && (
                  <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />
                )}
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {gridItems.length === 0 ? (
            <Text style={[styles.emptyGrid, { color: colors.mutedText }]}>
              {activeTab === 'Wardrobe' ? 'No items yet' : 'No outfits yet'}
            </Text>
          ) : (
            gridItems.map((item) => (
              <GridItem
                key={item.id}
                uri={
                  'frontImageUrl' in item
                    ? item.frontImageUrl
                    : (item as Outfit).coverImageUrl ?? ''
                }
                colors={colors}
              />
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
          <Image source={{ uri }} style={StyleSheet.flatten({ flex: 1 })} resizeMode="cover" />
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
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
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
  actionButtons: { paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', gap: 10 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 15, letterSpacing: -0.2 },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: 32,
    borderRadius: 2,
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
