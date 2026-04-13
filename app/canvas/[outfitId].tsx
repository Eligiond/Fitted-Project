import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { CanvasItemComponent } from '@/components/outfits/CanvasItem';
import { WardrobeItem, CanvasItemLayout, Outfit } from '@/types';
import { SPRING_FAST } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRAY_HEIGHT = 100;

export default function CanvasScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { outfitId } = useLocalSearchParams<{ outfitId: string }>();
  const isNew = outfitId === 'new';

  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItemLayout[]>([]);
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [outfitName, setOutfitName] = useState('My Outfit');
  const [saving, setSaving] = useState(false);

  // Load wardrobe items
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'wardrobe_items'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setWardrobeItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WardrobeItem, 'id'>) })));
    });
    return unsub;
  }, [user]);

  // Load existing outfit if editing
  useEffect(() => {
    if (isNew || !outfitId) return;
    getDoc(doc(db, 'outfits', outfitId)).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Omit<Outfit, 'id'>;
      setOutfitName(data.name ?? 'My Outfit');
      setCanvasItems(data.canvasLayout ?? []);
      setAddedItemIds(data.itemIds ?? []);
    });
  }, [outfitId, isNew]);

  const addToCanvas = useCallback((item: WardrobeItem) => {
    if (addedItemIds.includes(item.id)) return;
    const newLayout: CanvasItemLayout = {
      itemId: item.id,
      x: SCREEN_WIDTH / 2 - 70,
      y: SCREEN_HEIGHT / 3 - 70,
      scale: 1,
      rotation: 0,
      zIndex: canvasItems.length + 1,
    };
    setCanvasItems((prev) => [...prev, newLayout]);
    setAddedItemIds((prev) => [...prev, item.id]);
    setSelectedItemId(item.id);
  }, [canvasItems.length, addedItemIds]);

  const removeFromCanvas = useCallback((id: string) => {
    setCanvasItems((prev) => prev.filter((i) => i.itemId !== id));
    setAddedItemIds((prev) => prev.filter((i) => i !== id));
    setSelectedItemId(null);
  }, []);

  const updateLayout = useCallback((id: string, partial: Partial<CanvasItemLayout>) => {
    setCanvasItems((prev) =>
      prev.map((item) => (item.itemId === id ? { ...item, ...partial } : item))
    );
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const data = {
        userId: user.uid,
        name: outfitName,
        itemIds: addedItemIds,
        canvasLayout: canvasItems,
        coverImageUrl: null,
        updatedAt: serverTimestamp(),
      };
      if (isNew) {
        await addDoc(collection(db, 'outfits'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      } else if (outfitId) {
        await updateDoc(doc(db, 'outfits', outfitId), data);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save outfit. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const canvasHeight = SCREEN_HEIGHT - insets.top - 60 - TRAY_HEIGHT - insets.bottom;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.separator }]}>
          <AnimatedButton
            variant="icon"
            icon={<Ionicons name="arrow-back" size={20} color={colors.primaryText} />}
            onPress={() => router.back()}
          />
          <TextInput
            value={outfitName}
            onChangeText={setOutfitName}
            style={[styles.nameInput, { color: colors.primaryText }]}
            selectionColor={colors.accent}
            returnKeyType="done"
            placeholderTextColor={colors.mutedText}
            placeholder="Outfit name"
          />
          <AnimatedButton
            variant="primary"
            label="Save"
            loading={saving}
            onPress={handleSave}
            style={styles.saveBtn}
          />
        </View>

        {/* Canvas */}
        <TouchableWithoutFeedback onPress={() => setSelectedItemId(null)}>
          <View
            style={[
              styles.canvas,
              {
                height: canvasHeight,
                backgroundColor: isDark ? '#0d0d0d' : '#f0f0ee',
              },
            ]}
          >
            {/* Grid lines for visual depth */}
            <View style={[styles.gridOverlay]} pointerEvents="none">
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={`h${i}`}
                  style={[
                    styles.gridLineH,
                    {
                      top: `${(i + 1) * (100 / 7)}%`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                />
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={`v${i}`}
                  style={[
                    styles.gridLineV,
                    {
                      left: `${(i + 1) * 20}%`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                />
              ))}
            </View>

            {canvasItems.length === 0 && (
              <View style={styles.canvasEmpty} pointerEvents="none">
                <Ionicons name="layers-outline" size={40} color={colors.mutedText} style={{ opacity: 0.4 }} />
                <Text style={[styles.canvasEmptyText, { color: colors.mutedText }]}>
                  Tap items below to add them
                </Text>
              </View>
            )}

            {canvasItems.map((layout) => {
              const item = wardrobeItems.find((wi) => wi.id === layout.itemId);
              if (!item) return null;
              return (
                <CanvasItemComponent
                  key={item.id}
                  item={item}
                  layout={layout}
                  isSelected={selectedItemId === item.id}
                  onSelect={setSelectedItemId}
                  onLayoutChange={updateLayout}
                  onRemove={removeFromCanvas}
                />
              );
            })}
          </View>
        </TouchableWithoutFeedback>

        {/* Bottom tray */}
        <View
          style={[
            styles.tray,
            {
              height: TRAY_HEIGHT + insets.bottom,
              backgroundColor: colors.surface,
              borderTopColor: colors.separator,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trayContent}
          >
            {wardrobeItems.map((item) => {
              const isAdded = addedItemIds.includes(item.id);
              return (
                <TrayItem
                  key={item.id}
                  item={item}
                  isAdded={isAdded}
                  onPress={() => isAdded ? removeFromCanvas(item.id) : addToCanvas(item)}
                  colors={colors}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const TrayItem: React.FC<{
  item: WardrobeItem;
  isAdded: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ item, isAdded, onPress, colors }) => {
  const scale = useSharedValue(1);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableWithoutFeedback
      onPressIn={() => { scale.value = withSpring(0.9, SPRING_FAST); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_FAST); }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            width: 72,
            height: 72,
            borderRadius: 14,
            backgroundColor: colors.background,
            marginRight: 10,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: isAdded ? colors.accent : 'transparent',
          },
          s,
        ]}
      >
        <Image source={{ uri: item.frontImageUrl }} style={{ flex: 1 }} resizeMode="contain" />
        {isAdded && (
          <View style={[styles.addedIndicator, { backgroundColor: colors.accent }]}>
            <Ionicons name="checkmark" size={12} color="#111" />
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  saveBtn: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  canvasEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  canvasEmptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tray: {
    borderTopWidth: 1,
  },
  trayContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
