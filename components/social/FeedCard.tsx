import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { arrayUnion, arrayRemove, doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { SocialPost } from '@/types';
import { SPRING_FAST, SPRING_BOUNCY, RADII } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.05;

interface FeedCardProps {
  post: SocialPost;
  onUserPress?: (userId: string) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({ post, onUserPress }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isLiked = user ? post.likes.includes(user.uid) : false;

  const heartScale = useSharedValue(1);
  const heartBurstScale = useSharedValue(0);
  const heartBurstOpacity = useSharedValue(0);
  const likeButtonScale = useSharedValue(1);

  const lastTap = useRef(0);

  const triggerHeartBurst = useCallback(() => {
    heartBurstScale.value = 0;
    heartBurstOpacity.value = 0;
    heartBurstScale.value = withSpring(1.4, { damping: 6, stiffness: 180 });
    heartBurstOpacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withDelay(300, withTiming(0, { duration: 350 }))
    );
  }, []);

  const toggleLike = useCallback(async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeButtonScale.value = withSequence(
      withSpring(1.4, SPRING_BOUNCY),
      withSpring(1, SPRING_FAST)
    );
    const ref = doc(db, 'social_posts', post.id);
    if (isLiked) {
      await updateDoc(ref, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(ref, { likes: arrayUnion(user.uid) });
    }
  }, [user, isLiked, post.id]);

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(triggerHeartBurst)();
      if (!isLiked) {
        runOnJS(toggleLike)();
      }
    });

  const likeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeButtonScale.value }],
  }));

  const heartBurstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartBurstScale.value }],
    opacity: heartBurstOpacity.value,
  }));

  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <TouchableWithoutFeedback onPress={() => onUserPress?.(post.userId)}>
        <View style={styles.header}>
          <View
            style={[
              styles.avatarContainer,
              { borderColor: colors.accent },
            ]}
          >
            {post.userAvatarUrl ? (
              <Image source={{ uri: post.userAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarInitial}>
                  {(post.userDisplayName ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.primaryText }]}>
              {post.userDisplayName ?? 'Fitted User'}
            </Text>
            <Text style={[styles.userHandle, { color: colors.mutedText }]}>
              {post.userHandle ?? '@user'} · {timeAgo}
            </Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedText} />
        </View>
      </TouchableWithoutFeedback>

      {/* Image */}
      <GestureDetector gesture={doubleTapGesture}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: post.imageUrl }}
            style={[styles.image, { height: IMAGE_HEIGHT }]}
            resizeMode="cover"
          />
          {/* Heart burst overlay */}
          <View style={[StyleSheet.absoluteFillObject, styles.burstContainer]}>
            <Animated.View style={heartBurstStyle}>
              <Ionicons name="heart" size={80} color={colors.heartRed} />
            </Animated.View>
          </View>
        </View>
      </GestureDetector>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableWithoutFeedback onPress={toggleLike}>
          <Animated.View style={[styles.actionBtn, likeButtonStyle]}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={isLiked ? colors.heartRed : colors.primaryText}
            />
            <Text style={[styles.actionCount, { color: colors.primaryText }]}>
              {post.likes.length}
            </Text>
          </Animated.View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.primaryText} />
            <Text style={[styles.actionCount, { color: colors.primaryText }]}>
              {post.comments.length}
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={[styles.actionBtn, { marginLeft: 'auto' }]}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.primaryText} />
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Caption */}
      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={[styles.captionUser, { color: colors.primaryText }]}>
            {post.userHandle ?? '@user'}
          </Text>
          <Text style={[styles.captionText, { color: colors.primaryText }]}> {post.caption}</Text>
        </View>
      ) : null}
    </View>
  );
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#111',
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  userHandle: {
    fontSize: 12,
    marginTop: 1,
  },
  image: {
    width: '100%',
  },
  burstContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontWeight: '600',
    fontSize: 14,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  captionUser: {
    fontWeight: '700',
    fontSize: 14,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
