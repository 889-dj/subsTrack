import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. */
  pressedScale?: number;
}

/**
 * Pressable that springs to a slightly smaller scale on touch. Skipped under
 * reduce-motion. The scale lives on a wrapping Animated.View (not an animated
 * Pressable) so responder props are never forwarded to a DOM node on web.
 */
export function PressableScale({
  style,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...rest}
        onPressIn={(e) => {
          if (!reduced) scale.value = withSpring(pressedScale, PRESS_SPRING);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (!reduced) scale.value = withSpring(1, PRESS_SPRING);
          onPressOut?.(e);
        }}
        style={style}
      />
    </Animated.View>
  );
}
