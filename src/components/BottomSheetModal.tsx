import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { gutter, radius, space, type Palette } from '@/src/theme';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: DimensionValue;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

/**
 * The app's single bottom-sheet motion language: the screen dims in place
 * while the raised ledger surface arrives independently from below. Keeping
 * the scrim and sheet on separate animated values prevents the black overlay
 * from appearing to slide up with the content.
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  maxHeight = '75%',
  contentStyle,
  accessibilityLabel,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rendered, setRendered] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const sheetOffset = useRef(new Animated.Value(visible ? 0 : 32)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (visible) setRendered(true);
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;

    if (reduceMotion) {
      backdropOpacity.setValue(visible ? 1 : 0);
      sheetOffset.setValue(0);
      if (!visible) setRendered(false);
      return;
    }

    if (visible) {
      backdropOpacity.setValue(0);
      sheetOffset.setValue(32);
    }

    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 180,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOffset, {
        toValue: visible ? 0 : 24,
        duration: visible ? 260 : 200,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });

    return () => animation.stop();
  }, [visible, rendered, reduceMotion, backdropOpacity, sheetOffset]);

  return (
    <Modal
      visible={rendered}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root} accessibilityViewIsModal accessibilityLabel={accessibilityLabel}>
        <Animated.View
          pointerEvents="none"
          style={[styles.scrim, { opacity: backdropOpacity }]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${accessibilityLabel}`}
        />
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight, transform: [{ translateY: sheetOffset }] },
          ]}
        >
          <View
            style={[
              styles.content,
              { paddingBottom: Math.max(space.xl, insets.bottom + space.md) },
              contentStyle,
            ]}
          >
            <View style={styles.handle} accessibilityElementsHidden />
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    scrim: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.modalScrim,
    },
    sheet: {
      backgroundColor: colors.elevated,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderTopWidth: 1,
      borderColor: colors.hairline,
      shadowColor: colors.shadow,
      shadowOpacity: colors.isDark ? 0.34 : 0.16,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: -7 },
      elevation: 14,
    },
    content: {
      paddingHorizontal: gutter,
      paddingTop: space.md,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.sheetHandle,
      alignSelf: 'center',
      marginBottom: space.lg,
    },
  });
