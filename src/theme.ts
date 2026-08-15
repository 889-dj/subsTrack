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
  paper: '#F2F3F0', // cool recycled-statement grey-white, app background
  paper2: '#ECEDE9',
  surface: '#FFFFFF', // cards
  elevated: '#FFFFFF',
  ink: '#16181A', // primary text
  muted: '#6B6F76', // labels, secondary
  faint: '#9A9DA4',
  hairline: '#DEDFDA', // 1px rules, borders
  indigo: '#2A2F6B', // brand — stamp ink. Buttons, active states, brand marks
  indigoBg: '#E7E8F0', // indigo tint for chips/badges
  cyan: '#0E7C86',
  pink: '#A23A63',
  debit: '#B23A2F',
  saved: '#2F6B4F',
  savedBg: '#E4EDE8',
  warning: '#8A5A12',
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
  ink: '#F5F7FA', // text primary
  muted: '#9299A8', // text secondary
  faint: '#5E6573', // text muted
  hairline: 'rgba(255,255,255,0.07)', // border
  indigo: '#8B5CF6', // primary accent — electric violet
  indigoBg: 'rgba(139,92,246,0.14)',
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
      fontSize: 42,
      lineHeight: 46,
      letterSpacing: -1.2,
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
      fontSize: 19,
      lineHeight: 24,
      letterSpacing: -0.2,
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

export const radius = { card: 20, cardSm: 15, chip: 999, sheet: 24 };

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
