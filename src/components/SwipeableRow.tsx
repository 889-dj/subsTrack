import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { PressableScale } from '@/src/components/PressableScale';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

export interface SwipeAction {
  label: string;
  tone: 'primary' | 'danger';
  onPress: () => void;
}

interface SwipeableRowProps {
  actions: SwipeAction[];
  children: React.ReactNode;
}

const ACTION_WIDTH = 84;

/**
 * Swipe-left row actions (Things-style). Each action is a labelled 84pt-wide
 * target; opening past the threshold keeps them open until tapped or the row
 * is swiped back. Friction values follow the Gesture Handler docs' native feel.
 */
export function SwipeableRow({ actions, children }: SwipeableRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ref = useRef<SwipeableMethods>(null);

  return (
    // overflow:hidden — the closed action panel sits off-screen and must not widen the page on web.
    <View style={styles.clip}>
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      overshootFriction={8}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          {actions.map((action) => (
            <PressableScale
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                ref.current?.close();
                action.onPress();
              }}
              style={[styles.action, action.tone === 'danger' ? styles.danger : styles.primary]}
            >
              <Text
                style={[styles.label, action.tone === 'danger' ? styles.dangerLabel : styles.primaryLabel]}
              >
                {action.label}
              </Text>
            </PressableScale>
          ))}
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    clip: { overflow: 'hidden' },
    actions: {
      height: '100%',
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: space.xs,
      paddingLeft: space.sm,
      paddingVertical: space.xs,
    },
    action: {
      width: ACTION_WIDTH - space.xs,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.cardSm,
    },
    primary: { backgroundColor: colors.indigoBg },
    danger: { backgroundColor: `${colors.debit}24` },
    label: { fontFamily: font.sansSemi, fontSize: 13 },
    primaryLabel: { color: colors.indigo },
    dangerLabel: { color: colors.debit },
  });
