import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/src/components/PressableScale';
import { TAB_BAR_CLEARANCE } from '@/src/components/BottomNav';
import { useTheme } from '@/src/hooks/useTheme';
import { font, gutter, radius, space, type Palette } from '@/src/theme';

export interface ToastOptions {
  message: string;
  /** Label for the single action (usually "Undo"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Runs when the toast times out or is replaced without the action being tapped. */
  onExpire?: () => void;
  /** Milliseconds on screen. Long enough to read and react: 4s plain, 6s with an action. */
  duration?: number;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * One snackbar at a time, floating above the tab bar. Showing a new toast
 * settles the previous one first (its `onExpire` runs), so a pending
 * "undoable" delete is never silently dropped.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const current = useRef<ActiveToast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const expireCurrent = useCallback(() => {
    clearTimer();
    const active = current.current;
    current.current = null;
    setToast(null);
    active?.onExpire?.();
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      // Settle whatever is on screen before replacing it.
      if (current.current) expireCurrent();
      const active: ActiveToast = { ...options, id: nextId.current++ };
      current.current = active;
      setToast(active);
      timer.current = setTimeout(
        expireCurrent,
        options.duration ?? (options.actionLabel ? 6000 : 3500),
      );
    },
    [expireCurrent],
  );

  const handleAction = useCallback(() => {
    clearTimer();
    const active = current.current;
    current.current = null;
    setToast(null);
    active?.onAction?.();
  }, []);

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastView toast={toast} onAction={handleAction} />
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onAction }: { toast: ActiveToast | null; onAction: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.pill}>
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.actionLabel ? (
          <PressableScale
            onPress={onAction}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
            style={styles.action}
          >
            <Text style={styles.actionLabel}>{toast.actionLabel}</Text>
          </PressableScale>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: gutter,
      right: gutter,
      alignItems: 'center',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      minHeight: 48,
      paddingLeft: space.lg,
      paddingRight: space.sm,
      borderRadius: radius.card,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.hairline,
      shadowColor: colors.shadow,
      shadowOpacity: 0.28,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
      maxWidth: 520,
    },
    message: { flexShrink: 1, fontFamily: font.sansMed, fontSize: 14, lineHeight: 20, color: colors.ink },
    action: {
      minHeight: 40,
      minWidth: 56,
      paddingHorizontal: space.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.cardSm,
      backgroundColor: colors.indigoBg,
    },
    actionLabel: { fontFamily: font.sansSemi, fontSize: 14, color: colors.indigo },
  });
