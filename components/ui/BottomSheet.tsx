import React, { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/context/ThemeContext';
import { SPRING_MEDIUM } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetHandle {
  open: () => void;
  close: () => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  onClose?: () => void;
  snapHeight?: number;
}

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  ({ children, onClose, snapHeight = SCREEN_HEIGHT * 0.75 }, ref) => {
    const { colors, isDark } = useTheme();
    const [visible, setVisible] = React.useState(false);
    const translateY = useSharedValue(snapHeight);
    const backdropOpacity = useSharedValue(0);

    const openSheet = useCallback(() => {
      setVisible(true);
      translateY.value = withSpring(0, SPRING_MEDIUM);
      backdropOpacity.value = withSpring(1, SPRING_MEDIUM);
    }, []);

    const closeSheet = useCallback(() => {
      translateY.value = withSpring(snapHeight, { damping: 20, stiffness: 300 });
      backdropOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
      setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 300);
    }, [snapHeight, onClose]);

    useImperativeHandle(ref, () => ({
      open: openSheet,
      close: closeSheet,
    }));

    const panGesture = Gesture.Pan()
      .onUpdate((e) => {
        if (e.translationY > 0) {
          translateY.value = e.translationY;
          backdropOpacity.value = Math.max(0, 1 - e.translationY / snapHeight);
        }
      })
      .onEnd((e) => {
        if (e.translationY > snapHeight * 0.35 || e.velocityY > 500) {
          runOnJS(closeSheet)();
        } else {
          translateY.value = withSpring(0, SPRING_MEDIUM);
          backdropOpacity.value = withSpring(1, SPRING_MEDIUM);
        }
      });

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    if (!visible) return null;

    return (
      <Modal transparent visible={visible} statusBarTranslucent animationType="none">
        <View style={StyleSheet.absoluteFillObject}>
          <TouchableWithoutFeedback onPress={closeSheet}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: colors.overlay },
                backdropStyle,
              ]}
            />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            pointerEvents="box-none"
          >
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    overflow: 'hidden',
                    maxHeight: snapHeight,
                  },
                  sheetStyle,
                ]}
              >
                {/* Drag handle */}
                <View style={styles.handleContainer}>
                  <View
                    style={[styles.handle, { backgroundColor: colors.separator }]}
                  />
                </View>
                {children}
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
