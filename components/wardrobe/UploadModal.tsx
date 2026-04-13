import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as fireRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/constants/firebase';
import { BottomSheet, BottomSheetHandle } from '@/components/ui/BottomSheet';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { PillFilter } from '@/components/ui/PillFilter';
import { ShimmerLoader } from '@/components/ui/ShimmerLoader';
import { Checkerboard } from '@/components/ui/Checkerboard';
import { WardrobeCategory, WARDROBE_CATEGORIES } from '@/types';
import { RADII } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SIZE = SCREEN_WIDTH - 80;
const REMOVE_BG_API_KEY = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY ?? 'REMOVE_BG_API_KEY';

interface UploadModalProps {
  onSaved?: () => void;
}

export interface UploadModalHandle {
  open: () => void;
}

export const UploadModal = React.forwardRef<UploadModalHandle, UploadModalProps>(
  ({ onSaved }, ref) => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const sheetRef = useRef<BottomSheetHandle>(null);

    const [frontUri, setFrontUri] = useState<string | null>(null);
    const [backUri, setBackUri] = useState<string | null>(null);
    const [processingFront, setProcessingFront] = useState(false);
    const [processingBack, setProcessingBack] = useState(false);
    const [category, setCategory] = useState<WardrobeCategory>('Tops');
    const [tags, setTags] = useState('');
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<'pick' | 'configure'>('pick');

    React.useImperativeHandle(ref, () => ({
      open: () => {
        reset();
        sheetRef.current?.open();
      },
    }));

    const reset = () => {
      setFrontUri(null);
      setBackUri(null);
      setCategory('Tops');
      setTags('');
      setSaving(false);
      setStep('pick');
    };

    const pickImage = async (isFront: boolean) => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri, isFront);
      }
    };

    const takePhoto = async (isFront: boolean) => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri, isFront);
      }
    };

    const processImage = async (uri: string, isFront: boolean) => {
      if (isFront) setProcessingFront(true);
      else setProcessingBack(true);

      try {
        const removedBgUri = await removeBg(uri);
        if (isFront) {
          setFrontUri(removedBgUri);
          setStep('configure');
        } else {
          setBackUri(removedBgUri);
        }
      } catch {
        // Fall back to original image if bg removal fails
        if (isFront) {
          setFrontUri(uri);
          setStep('configure');
        } else {
          setBackUri(uri);
        }
      } finally {
        if (isFront) setProcessingFront(false);
        else setProcessingBack(false);
      }
    };

    const removeBg = async (imageUri: string): Promise<string> => {
      const formData = new FormData();
      formData.append('image_file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as unknown as Blob);
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: formData,
      });

      if (!response.ok) throw new Error('Background removal failed');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const uploadToStorage = async (uri: string, path: string): Promise<string> => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = fireRef(storage, path);
      await uploadBytes(storageRef, blob);
      return getDownloadURL(storageRef);
    };

    const handleSave = async () => {
      if (!frontUri || !user) return;
      setSaving(true);
      try {
        const timestamp = Date.now();
        const frontUrl = await uploadToStorage(
          frontUri,
          `wardrobe/${user.uid}/${timestamp}_front.png`
        );
        let backUrl: string | undefined;
        if (backUri) {
          backUrl = await uploadToStorage(
            backUri,
            `wardrobe/${user.uid}/${timestamp}_back.png`
          );
        }

        await addDoc(collection(db, 'wardrobe_items'), {
          userId: user.uid,
          frontImageUrl: frontUrl,
          backImageUrl: backUrl ?? null,
          category,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          createdAt: serverTimestamp(),
        });

        sheetRef.current?.close();
        onSaved?.();
      } catch (e) {
        Alert.alert('Error', 'Failed to save item. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    const categories = WARDROBE_CATEGORIES.filter((c) => c !== 'All') as WardrobeCategory[];

    return (
      <BottomSheet ref={sheetRef} snapHeight={Dimensions.get('window').height * 0.88}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.primaryText }]}>Add to Wardrobe</Text>

          {step === 'pick' && !processingFront && (
            <View style={styles.pickButtons}>
              <AnimatedButton
                variant="secondary"
                label="Take Photo"
                icon={<Ionicons name="camera-outline" size={20} color={colors.primaryText} />}
                onPress={() => takePhoto(true)}
                style={styles.pickButton}
              />
              <AnimatedButton
                variant="secondary"
                label="Choose from Library"
                icon={<Ionicons name="images-outline" size={20} color={colors.primaryText} />}
                onPress={() => pickImage(true)}
                style={styles.pickButton}
              />
            </View>
          )}

          {processingFront && (
            <View style={styles.shimmerContainer}>
              <ShimmerLoader width={PREVIEW_SIZE} height={PREVIEW_SIZE} borderRadius={RADII.card} />
              <Text style={[styles.processingText, { color: colors.mutedText }]}>
                Removing background…
              </Text>
            </View>
          )}

          {step === 'configure' && frontUri && !processingFront && (
            <>
              {/* Front image preview */}
              <View style={[styles.previewContainer, { borderColor: colors.cardBorder }]}>
                <View style={[styles.checkerWrap, { borderRadius: RADII.card - 2 }]}>
                  <Checkerboard
                    size={16}
                    rows={Math.ceil(PREVIEW_SIZE / 16)}
                    cols={Math.ceil(PREVIEW_SIZE / 16)}
                  />
                </View>
                <Image
                  source={{ uri: frontUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>

              {/* Back photo */}
              {!backUri && !processingBack && (
                <AnimatedButton
                  variant="secondary"
                  label="Add Back Photo (Optional)"
                  icon={<Ionicons name="refresh-outline" size={18} color={colors.primaryText} />}
                  onPress={() => pickImage(false)}
                  style={styles.backButton}
                />
              )}
              {processingBack && (
                <ShimmerLoader
                  width={PREVIEW_SIZE}
                  height={80}
                  borderRadius={12}
                  style={styles.backButton}
                />
              )}
              {backUri && (
                <View style={styles.backPreview}>
                  <Image source={{ uri: backUri }} style={styles.backImage} resizeMode="contain" />
                  <Text style={[styles.backLabel, { color: colors.mutedText }]}>Back added ✓</Text>
                </View>
              )}

              {/* Category */}
              <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>CATEGORY</Text>
              <PillFilter
                options={categories}
                selected={category}
                onSelect={setCategory}
                style={{ paddingHorizontal: 0, paddingVertical: 8 }}
              />

              {/* Tags */}
              <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>TAGS</Text>
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="vintage, oversized, casual"
                placeholderTextColor={colors.mutedText}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.primaryText,
                    borderColor: colors.cardBorder,
                  },
                ]}
                returnKeyType="done"
              />

              <AnimatedButton
                variant="primary"
                label="Save to Wardrobe"
                loading={saving}
                onPress={handleSave}
                style={styles.saveButton}
              />
            </>
          )}
        </ScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  pickButtons: {
    gap: 12,
  },
  pickButton: {
    width: '100%',
  },
  shimmerContainer: {
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    alignSelf: 'center',
    borderRadius: RADII.card,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  checkerWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    marginBottom: 16,
  },
  backPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'transparent',
  },
  backImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: RADII.input,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 24,
  },
  saveButton: {
    width: '100%',
  },
});
