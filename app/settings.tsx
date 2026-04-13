import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/constants/firebase';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { RADII } from '@/constants/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user, appUser, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState(appUser?.displayName ?? '');
  const [handle, setHandle] = useState(appUser?.handle ?? '');
  const [bio, setBio] = useState(appUser?.bio ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName, handle, bio });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.separator },
        ]}
      >
        <AnimatedButton
          variant="icon"
          icon={<Ionicons name="arrow-back" size={20} color={colors.primaryText} />}
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: colors.primaryText }]}>Settings</Text>
        <AnimatedButton
          variant="primary"
          label="Save"
          loading={saving}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Profile */}
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>PROFILE</Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.field, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={[styles.input, { color: colors.primaryText }]}
              placeholderTextColor={colors.mutedText}
              placeholder="Your name"
              selectionColor={colors.accent}
              returnKeyType="next"
            />
          </View>
          <View style={[styles.field, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Handle</Text>
            <TextInput
              value={handle}
              onChangeText={setHandle}
              style={[styles.input, { color: colors.primaryText }]}
              placeholderTextColor={colors.mutedText}
              placeholder="@handle"
              selectionColor={colors.accent}
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>
          <View style={[styles.fieldLast]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.bioInput, { color: colors.primaryText }]}
              placeholderTextColor={colors.mutedText}
              placeholder="Tell the world your style..."
              selectionColor={colors.accent}
              multiline
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>APPEARANCE</Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.fieldLast}>
            <View style={styles.rowInner}>
              <Text style={[styles.rowLabel, { color: colors.primaryText }]}>Dark Mode</Text>
              <ThemeToggle />
            </View>
          </View>
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>ACCOUNT</Text>
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.fieldLast}>
            <Text style={[styles.rowLabel, { color: colors.mutedText }]}>
              {user?.email ?? user?.displayName ?? 'Signed in'}
            </Text>
          </View>
        </View>

        <View style={styles.signOutWrapper}>
          <AnimatedButton
            variant="destructive"
            label="Sign Out"
            icon={<Ionicons name="log-out-outline" size={18} color="#fff" />}
            onPress={handleSignOut}
            style={styles.signOutBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  saveBtn: { height: 40, paddingHorizontal: 20, borderRadius: 20 },
  scrollContent: { paddingTop: 28 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: RADII.card,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  fieldLast: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginBottom: 6 },
  input: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 2,
  },
  bioInput: { minHeight: 60, textAlignVertical: 'top' },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  signOutWrapper: { paddingHorizontal: 20 },
  signOutBtn: { height: 52, borderRadius: 26 },
});
