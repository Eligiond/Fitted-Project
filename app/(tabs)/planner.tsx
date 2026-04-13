import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PlannerEntry, Outfit } from '@/types';
import { SPRING_FAST, SPRING_MEDIUM, SIZES, RADII } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface ActionCardProps {
  title: string;
  icon: string;
  badge?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const ActionCard: React.FC<ActionCardProps> = ({ title, icon, badge, onPress, colors }) => {
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableWithoutFeedback
      onPressIn={() => { scale.value = withSpring(0.95, SPRING_FAST); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_FAST); }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.actionCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          s,
        ]}
      >
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color={colors.accent} />
        <Text style={[styles.actionCardTitle, { color: colors.primaryText }]}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default function PlannerScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const weekDays = getWeekDays();
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7; // 0=Mon

  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  const expandHeight = useSharedValue(0);
  const expandOpacity = useSharedValue(0);

  useEffect(() => {
    expandHeight.value = withSpring(120, SPRING_MEDIUM);
    expandOpacity.value = withTiming(1, { duration: 300 });
  }, [selectedDay]);

  const expandStyle = useAnimatedStyle(() => ({
    height: expandHeight.value,
    opacity: expandOpacity.value,
    overflow: 'hidden',
  }));

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'planner_entries'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlannerEntry, 'id'>) })));
    });
    const q2 = query(collection(db, 'outfits'), where('userId', '==', user.uid));
    const unsub2 = onSnapshot(q2, (snap) => {
      setOutfits(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Outfit, 'id'>) })));
    });
    return () => { unsub(); unsub2(); };
  }, [user]);

  const selectedDate = formatDate(weekDays[selectedDay]);
  const selectedEntry = entries.find((e) => e.date === selectedDate);
  const pastEntries = entries.filter((e) => e.date < formatDate(today));

  const handleDeleteEntry = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'planner_entries', id));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={[styles.dayName, { color: colors.primaryText }]}>
            {DAY_NAMES[todayIndex]}
          </Text>
          <Text style={[styles.dateText, { color: colors.mutedText }]}>
            {MONTHS[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <ThemeToggle />
          <AnimatedButton
            variant="icon"
            icon={<Ionicons name="notifications-outline" size={20} color={colors.primaryText} />}
            onPress={() => {}}
          />
          <AnimatedButton
            variant="icon"
            icon={<Ionicons name="calendar-outline" size={20} color={colors.primaryText} />}
            onPress={() => {}}
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
        {/* Weekly strip */}
        <View style={styles.weekStrip}>
          {weekDays.map((d, i) => {
            const isSelected = i === selectedDay;
            const isToday = i === todayIndex;
            const scale = useSharedValue(1);
            const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

            return (
              <TouchableWithoutFeedback
                key={i}
                onPressIn={() => { scale.value = withSpring(0.9, SPRING_FAST); }}
                onPressOut={() => { scale.value = withSpring(1, SPRING_FAST); }}
                onPress={() => {
                  expandHeight.value = 0;
                  expandOpacity.value = 0;
                  setSelectedDay(i);
                }}
              >
                <Animated.View
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.separator,
                    },
                    s,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: isSelected ? '#111' : colors.mutedText },
                    ]}
                  >
                    {DAYS[i]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: isSelected ? '#111' : isToday ? colors.accent : colors.primaryText,
                        fontWeight: isToday ? '800' : '600',
                      },
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </Animated.View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>

        {/* Selected day outfit */}
        <Animated.View style={[styles.selectedDayOutfit, expandStyle]}>
          {selectedEntry ? (
            <View style={[styles.entryPreview, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <Ionicons name="shirt" size={24} color={colors.accent} />
              <Text style={[styles.entryName, { color: colors.primaryText }]}>
                {outfits.find((o) => o.id === selectedEntry.outfitId)?.name ?? 'Outfit logged'}
              </Text>
            </View>
          ) : (
            <View style={[styles.entryEmpty, { borderColor: colors.separator }]}>
              <Text style={[styles.entryEmptyText, { color: colors.mutedText }]}>
                No outfit logged for this day
              </Text>
            </View>
          )}
        </Animated.View>

        {/* 2x2 Action grid */}
        <View style={styles.actionGrid}>
          <ActionCard
            title="Log Today's Outfit"
            icon="shirt-outline"
            onPress={() => {}}
            colors={colors}
          />
          <ActionCard
            title="Plan Tomorrow"
            icon="calendar-outline"
            onPress={() => {}}
            colors={colors}
          />
          <ActionCard
            title="Discover Outfits"
            icon="sparkles-outline"
            badge="Soon"
            onPress={() => {}}
            colors={colors}
          />
          <ActionCard
            title="Add Outfit Photo"
            icon="camera-outline"
            onPress={() => {}}
            colors={colors}
          />
        </View>

        {/* Past log */}
        {pastEntries.length > 0 && (
          <View style={styles.pastSection}>
            <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>PAST OUTFITS</Text>
            {pastEntries.map((entry) => {
              const outfit = outfits.find((o) => o.id === entry.outfitId);
              return (
                <PastEntryRow
                  key={entry.id}
                  entry={entry}
                  outfitName={outfit?.name}
                  colors={colors}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const PastEntryRow: React.FC<{
  entry: PlannerEntry;
  outfitName?: string;
  colors: ReturnType<typeof useTheme>['colors'];
  onDelete: () => void;
}> = ({ entry, outfitName, colors, onDelete }) => {
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const panGesture = {
    onUpdate: (e: { translationX: number }) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(-80, e.translationX);
        deleteOpacity.value = Math.min(1, -e.translationX / 60);
      }
    },
    onEnd: (e: { translationX: number }) => {
      if (e.translationX < -60) {
        translateX.value = withSpring(-80, SPRING_FAST);
        deleteOpacity.value = withTiming(1, { duration: 150 });
      } else {
        translateX.value = withSpring(0, SPRING_FAST);
        deleteOpacity.value = withSpring(0, SPRING_FAST);
      }
    },
  };

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const deleteStyle = useAnimatedStyle(() => ({ opacity: deleteOpacity.value }));

  return (
    <View style={styles.pastEntryContainer}>
      <Animated.View style={[deleteStyle, styles.deleteAction]}>
        <TouchableWithoutFeedback onPress={onDelete}>
          <View style={[styles.deleteBtn, { backgroundColor: colors.destructive }]}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
      <Animated.View
        style={[
          styles.pastEntry,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          rowStyle,
        ]}
      >
        <View style={[styles.entryDot, { backgroundColor: colors.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.entryDate, { color: colors.mutedText }]}>{entry.date}</Text>
          <Text style={[styles.entryName, { color: colors.primaryText }]}>
            {outfitName ?? 'Outfit'}
          </Text>
        </View>
        <AnimatedButton
          variant="icon"
          icon={<Ionicons name="pencil-outline" size={16} color={colors.primaryText} />}
          onPress={() => {}}
          style={{ width: 34, height: 34 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  dayName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  dateText: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  scrollContent: { paddingTop: 4 },
  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 16,
  },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 2,
  },
  dayLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  dayNumber: { fontSize: 16, fontWeight: '700' },
  selectedDayOutfit: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  entryPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADII.card,
    gap: 12,
    borderWidth: 1,
  },
  entryEmpty: {
    padding: 16,
    borderRadius: RADII.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  entryEmptyText: { fontSize: 14, fontWeight: '500' },
  entryName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 20 * 2 - 12) / 2,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    position: 'relative',
  },
  actionCardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: '#111', fontWeight: '700', fontSize: 10, letterSpacing: 0.4 },
  pastSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  pastEntryContainer: { marginBottom: 10, position: 'relative' },
  pastEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADII.card,
    borderWidth: 1,
    gap: 12,
  },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  entryDate: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
