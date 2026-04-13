import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppleAuthenticationButton, AppleAuthenticationButtonStyle, AppleAuthenticationButtonType } from 'expo-apple-authentication';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SPRING_SOFT, SPRING_MEDIUM } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const insets = useSafeAreaInsets();

  // Entrance animations
  const orbScale = useSharedValue(0.4);
  const orbOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(30);
  const wordmarkOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);

  // Pulsing glow
  const glowScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance
    orbOpacity.value = withDelay(100, withTiming(1, { duration: 600 }));
    orbScale.value = withDelay(100, withSpring(1, SPRING_SOFT));

    wordmarkOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    wordmarkY.value = withDelay(300, withSpring(0, SPRING_SOFT));

    taglineOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(450, withSpring(0, SPRING_SOFT));

    buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    buttonsY.value = withDelay(600, withSpring(0, SPRING_SOFT));

    // Continuous pulse on glow orb
    glowScale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2200 }),
          withTiming(0.95, { duration: 2200 })
        ),
        -1,
        true
      )
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value * glowScale.value }],
    opacity: orbOpacity.value,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wordmarkY.value }],
    opacity: wordmarkOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: taglineY.value }],
    opacity: taglineOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonsY.value }],
    opacity: buttonsOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Theme toggle */}
      <View style={[styles.themeToggleContainer, { top: insets.top + 12 }]}>
        <ThemeToggle />
      </View>

      {/* Glow orb cluster */}
      <View style={styles.orbContainer} pointerEvents="none">
        <Animated.View style={orbStyle}>
          <View style={[styles.orbOuter, { backgroundColor: colors.accent }]} />
          <View style={[styles.orbMid, { backgroundColor: colors.accent }]} />
          <View style={[styles.orbInner, { backgroundColor: colors.accent }]} />
        </Animated.View>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Wordmark */}
        <Animated.View style={wordmarkStyle}>
          <Text style={[styles.wordmark, { color: colors.primaryText }]}>Fitted</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={[styles.tagline, { color: colors.mutedText }]}>
            Your wardrobe, elevated.
          </Text>
        </Animated.View>
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, buttonsStyle]}>
        {/* Google */}
        <AnimatedButton
          variant="primary"
          label="Continue with Google"
          icon={<Ionicons name="logo-google" size={20} color="#111111" />}
          onPress={signInWithGoogle}
          style={styles.button}
        />

        {/* Apple — show on iOS only */}
        {Platform.OS === 'ios' ? (
          <AnimatedButton
            variant="secondary"
            label="Continue with Apple"
            icon={<Ionicons name="logo-apple" size={22} color={colors.primaryText} />}
            onPress={signInWithApple}
            style={styles.button}
          />
        ) : (
          <AnimatedButton
            variant="secondary"
            label="Continue with Apple"
            icon={<Ionicons name="logo-apple" size={22} color={colors.primaryText} />}
            onPress={signInWithApple}
            disabled
            style={[styles.button, { opacity: 0.4 }]}
          />
        )}
      </Animated.View>

      {/* TOS */}
      <Text
        style={[
          styles.tos,
          { color: colors.mutedText, bottom: insets.bottom + 20 },
        ]}
      >
        By continuing you agree to our{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> and{' '}
        <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  orbContainer: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.06,
  },
  orbMid: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.09,
  },
  orbInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.14,
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
    gap: 12,
  },
  wordmark: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 68,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  buttons: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    gap: 12,
  },
  button: {
    width: '100%',
  },
  tos: {
    position: 'absolute',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
