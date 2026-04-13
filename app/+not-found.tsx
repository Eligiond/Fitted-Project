import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { AnimatedButton } from '@/components/ui/AnimatedButton';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Ionicons name="sad-outline" size={64} color={colors.mutedText} style={{ opacity: 0.4 }} />
      <Text style={[styles.title, { color: colors.primaryText }]}>Page not found</Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]}>
        This screen doesn't exist.
      </Text>
      <AnimatedButton
        variant="primary"
        label="Go Home"
        onPress={() => router.replace('/(tabs)/wardrobe')}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: 8, paddingHorizontal: 32 },
});
