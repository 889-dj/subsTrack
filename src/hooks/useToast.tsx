import { toast } from 'panelui-native';

export interface ToastOptions {
  message: string;
  /** Label for the single action (usually "Undo"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Runs when the toast times out without the action being tapped. */
  onExpire?: () => void;
  /** Milliseconds on screen. 3.5s plain, 6s with an action so Undo is reachable. */
  duration?: number;
}

/**
 * Thin wrapper over panelui's toast (the viewport is mounted by PanelUIProvider).
 * Panelui's toast has no expiry callback, and a pending "undoable" delete must
 * fire exactly when the window to undo closes — so each call keeps its own
 * timer and settles once, either through the action or through expiry.
 * Toasts sit at the top: the bottom edge belongs to the floating tab bar.
 */
function show({ message, actionLabel, onAction, onExpire, duration }: ToastOptions): void {
  const total = duration ?? (actionLabel ? 6000 : 3500);
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const settle = (viaAction: boolean) => {
    if (settled) return;
    settled = true;
    if (timer) clearTimeout(timer);
    if (viaAction) onAction?.();
    else onExpire?.();
  };

  toast.show({
    placement: 'top',
    label: message,
    actionLabel,
    duration: total,
    onActionPress: (handle) => {
      settle(true);
      handle.hide();
    },
  });

  // Fires the expiry work even if the toast is dismissed by a swipe or replaced.
  if (onExpire) timer = setTimeout(() => settle(false), total);
}

export function useToast(): { show: typeof show } {
  return { show };
}
