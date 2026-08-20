import type { TextStyle } from 'react-native';

/**
 * Two visual worlds, one shape. Dark is the showcase: a near-black cosmic
 * surface with a single violet→cyan accent pair, used sparingly (hero glow,
 * primary CTA, selected states, chart fill). Light stays close to the
 * original ledger look — paper, hairlines, indigo ink — so the app still
 * reads cleanly with the system set to light. Every screen is built from the
 * same primitives; only the palette moves.
 */
export interface Palette {
  /** App background. */
  paper: string;
  /** Secondary background — sits between paper and card, used for subtle zoning. */
  paper2: string;
  /** Card surface. */
  surface: string;
  /** One step up from `surface` — modals, raised rows, the hero card. */
  elevated: string;
  /** Screen-dimming layer behind bottom sheets and transparent modals. */
  modalScrim: string;
  /** Grabber shown at the top of every bottom sheet. */
  sheetHandle: string;
  /** Neutral shadow colour for raised surfaces. */
  shadow: string;
  /** Brand ink block used for the single primary data surface. */
  heroSurface: string;
  heroInk: string;
  heroMuted: string;
  ink: string;
  /** Secondary text. */
  muted: string;
  /** Tertiary / faintest text — timestamps, placeholders. */
  faint: string;
  hairline: string;
  indigo: string;
  indigoBg: string;
  /** Secondary accent — cyan. Used only in gradients and small highlights. */
  cyan: string;
  /** Tertiary accent — pink. Used only in the alternate gradient. */
  pink: string;
  /** ONLY money going out / danger. Never decorative. */
  debit: string;
  /** ONLY the saved total / success. Never decorative. */
  saved: string;
  savedBg: string;
  /** Warning / attention accent — renewal-soon badges. */
  warning: string;
  white: string;
  /** True on dark, false on light — flips status bar / native control style. */
  isDark: boolean;
}

export const lightColors: Palette = {
  paper: '#F7F8FA',
  paper2: '#EEF0F4',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  modalScrim: 'rgba(8,12,24,0.38)',
  sheetHandle: '#D3D7E1',
  shadow: '#000000',
  heroSurface: '#18214A',
  heroInk: '#FFFFFF',
  heroMuted: '#B9C2EA',
  ink: '#171A24',
  muted: '#5D6472',
  faint: '#69717F',
  hairline: '#E6E8ED',
  indigo: '#4457E6',
  indigoBg: '#E9ECFF',
  cyan: '#087F8C',
  pink: '#D14D72',
  debit: '#C0443D',
  saved: '#207A55',
  savedBg: '#E2F2EA',
  warning: '#9A650B',
  white: '#FFFFFF',
  isDark: false,
};

/**
 * The showcase palette — very dark, near-black, with a single violet/cyan
 * accent pair reserved for hero glow, the primary CTA, selected states, and
 * chart fills. Everywhere else stays neutral.
 */
export const darkColors: Palette = {
  paper: '#08090C', // background primary
  paper2: '#0D0F14', // background secondary
  surface: '#12151B', // card
  elevated: '#171A21', // elevated card / hero / modals
  modalScrim: 'rgba(0,0,0,0.62)',
  sheetHandle: 'rgba(255,255,255,0.18)',
  shadow: '#000000',
  heroSurface: '#5367F5',
  heroInk: '#FFFFFF',
  heroMuted: '#DCE1FF',
  ink: '#F5F7FA', // text primary
  muted: '#9299A8', // text secondary
  faint: '#828A9B', // tertiary text, kept above WCAG AA on the dark background
  hairline: 'rgba(255,255,255,0.07)', // border
  indigo: '#8FA0FF',
  indigoBg: 'rgba(143,160,255,0.14)',
  cyan: '#5EE7FF', // secondary accent
  pink: '#FF5CAA', // tertiary accent
  debit: '#FF6B7A', // danger
  saved: '#5EE6A8', // success
  savedBg: 'rgba(94,230,168,0.14)',
  warning: '#FFCA70',
  white: '#FFFFFF',
  isDark: true,
};

export const palettes = { light: lightColors, dark: darkColors };
export type ThemeMode = keyof typeof palettes;

/** The two-stop gradients used sparingly across the dark UI. */
export const gradients = {
  primary: ['#8B5CF6', '#5EE7FF'] as const,
  warm: ['#8B5CF6', '#FF5CAA'] as const,
};

export const font = {
  mono: 'GeistMono_400Regular',
  monoMed: 'GeistMono_500Medium',
  sans: 'Geist_400Regular',
  sansMed: 'Geist_500Medium',
  sansSemi: 'Geist_600SemiBold',
};

/**
 * Every numeral in the app renders with tabular figures — it is what stops
 * amounts jittering during the count-up and keeps the amount column aligned.
 */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * The text scale is a function of the palette, not a fixed object — every
 * size that carries a colour (all of them) has to repaint when the theme
 * flips. Screens call `useTheme()` and get this back pre-resolved.
 */
export function createTextStyles(colors: Palette) {
  return {
    /** The reveal number, 32-44px range for hero cards. */
    hero: {
      fontFamily: font.monoMed,
      fontSize: 44,
      lineHeight: 48,
      letterSpacing: -1.6,
      color: colors.ink,
      ...tabular,
    },
    /** Home header total. */
    total: {
      fontFamily: font.monoMed,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -0.8,
      color: colors.ink,
      ...tabular,
    },
    /** Page heading — understated, not shouty. Screen titles, greetings. */
    heading: {
      fontFamily: font.sansMed,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.7,
      color: colors.ink,
    },
    /** Section heading, one step under `heading`. */
    section: {
      fontFamily: font.sansSemi,
      fontSize: 15,
      lineHeight: 20,
      color: colors.ink,
    },
    title: { fontFamily: font.sansSemi, fontSize: 18, lineHeight: 24, color: colors.ink },
    body: { fontFamily: font.sans, fontSize: 15, lineHeight: 22, color: colors.ink },
    /** Row amounts. */
    amount: {
      fontFamily: font.mono,
      fontSize: 15,
      lineHeight: 22,
      color: colors.ink,
      ...tabular,
    },
    label: {
      fontFamily: font.mono,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
      color: colors.muted,
    },
    caption: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: colors.muted },
  } satisfies Record<string, TextStyle>;
}

export type TextStyles = ReturnType<typeof createTextStyles>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };

export const radius = { card: 18, cardSm: 12, chip: 999, sheet: 22 };

/** Screen horizontal padding. The same everywhere, no exceptions. */
export const gutter = 20;

/**
 * Elevation is done with hairlines + surface-vs-elevated contrast, plus a
 * soft glow only behind hero elements (implemented per-component, not here).
 */
export function createHairlineBorder(colors: Palette) {
  return {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  };
}
