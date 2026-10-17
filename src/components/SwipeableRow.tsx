import React from 'react';
import { Swipe } from 'panelui-native';

export interface SwipeAction {
  label: string;
  tone: 'primary' | 'danger';
  onPress: () => void;
}

interface SwipeableRowProps {
  actions: SwipeAction[];
  children: React.ReactNode;
}

/**
 * Swipe-left row actions, on panelui's `Swipe` (UI-thread drag, rubber-band,
 * one open row at a time inside a `Swipe.Group`, haptics where available).
 * Kept behind this small wrapper so screens only describe their actions.
 */
export function SwipeableRow({ actions, children }: SwipeableRowProps) {
  return (
    <Swipe>
      <Swipe.End>
        {actions.map((action) => (
          <Swipe.Action
            key={action.label}
            label={action.label}
            color={action.tone === 'danger' ? 'destructive' : 'primary'}
            onPress={action.onPress}
          />
        ))}
      </Swipe.End>
      {children}
    </Swipe>
  );
}

/** Rows inside close each other, so only one is ever open. */
export const SwipeableGroup = Swipe.Group;
