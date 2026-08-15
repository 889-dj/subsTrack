import React from 'react';
import { HugeiconsIcon, type HugeiconsProps } from '@hugeicons/react-native';
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AnalyticsUpIcon,
  Award01Icon,
  BookOpen02Icon,
  Calendar03Icon,
  Cancel01Icon,
  ChartDownIcon,
  ChartHistogramIcon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  FlashIcon,
  InformationCircleIcon,
  Notification03Icon,
  PieChart02Icon,
  Search01Icon,
  Tick02Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';

/**
 * Every icon the app uses, named the way the call sites already spoke about
 * them (chevron-forward, close, search, …) so swapping the icon library was a
 * one-line import change per file rather than a rename everywhere. Hugeicons'
 * free tier is stroke-only — there's no separate filled variant for a
 * focused nav tab, so "active" state is carried by colour and the pill
 * background instead of swapping the glyph.
 */
const ICONS = {
  'chevron-forward': ArrowRight01Icon,
  'chevron-back': ArrowLeft01Icon,
  'chevron-down': ArrowDown01Icon,
  'arrow-back': ArrowLeft01Icon,
  close: Cancel01Icon,
  checkmark: Tick02Icon,
  'checkmark-circle': CheckmarkCircle02Icon,
  flash: FlashIcon,
  'information-circle-outline': InformationCircleIcon,
  'notifications-outline': Notification03Icon,
  search: Search01Icon,
  'calendar-outline': Calendar03Icon,
  'reader-outline': BookOpen02Icon,
  'stats-chart-outline': ChartHistogramIcon,
  'trending-up': ChartUpIcon,
  'trending-down': ChartDownIcon,
  add: Add01Icon,
  home: BookOpen02Icon, // placeholder, overridden per-tab in BottomNav
  wallet: Wallet01Icon,
  calendar: Calendar03Icon,
  chart: AnalyticsUpIcon,
  trophy: Award01Icon,
  'pie-chart': PieChart02Icon,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<HugeiconsProps, 'icon'> {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color, strokeWidth = 1.8, ...rest }: IconProps) {
  return (
    <HugeiconsIcon icon={ICONS[name]} size={size} color={color} strokeWidth={strokeWidth} {...rest} />
  );
}
