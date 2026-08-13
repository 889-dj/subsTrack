import type { TextStyle } from 'react-native';

/**
 * Two visual worlds, one shape. Light is the bank statement and the debit
 * SMS — paper, hairlines, mono. Dark is the same statement read at night: a
 * near-black ledger with brand-coloured icon tiles standing in for a logo,
 * no gradients. Every screen is built from the same primitives; only the
 * palette moves.
 */
export interface Palette {
  paper: string;
  surface: string;
  ink: string;
  muted: string;
  hairline: string;
  indigo: string;
  indigoBg: string;
  /** ONLY money going out. Never decorative. */
  debit: string;
  /** ONLY the saved total. Never decorative. */
  saved: string;
  savedBg: string;
  white: string;
  /** True on dark, false on light — flips status bar / native control style. */
  isDark: boolean;
}

export const lightColors: Palette = {
  paper: '#F2F3F0', // cool recycled-statement grey-white, app background
  surface: '#FFFFFF', // cards
  ink: '#16181A', // primary text
  muted: '#6B6F76', // labels, secondary
  hairline: '#DEDFDA', // 1px rules, borders
  indigo: '#2A2F6B', // brand — stamp ink. Buttons, active states, brand marks
  indigoBg: '#E7E8F0', // indigo tint for chips/badges
  debit: '#B23A2F',
  saved: '#2F6B4F',
  savedBg: '#E4EDE8',
  white: '#FFFFFF',
  isDark: false,
};

export const darkColors: Palette = {
  paper: '#0B0B0D', // near-black app background
  surface: '#18191C', // charcoal cards — one step up from paper, no gradient
  ink: '#EDEDEF', // primary text
  muted: '#8B8E96', // labels, secondary
  hairline: '#2A2B2F', // 1px rules, borders
  indigo: '#7C82E8', // brighter on dark so it still reads as ink against charcoal
  indigoBg: '#22243A', // indigo tint for chips/badges
  debit: '#E06456',
  saved: '#4FAE7C',
  savedBg: '#173226',
  white: '#FFFFFF',
  isDark: true,
};

export const palettes = { light: lightColors, dark: darkColors };
export type ThemeMode = keyof typeof palettes;

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
    /** The reveal number. */
    hero: {
      fontFamily: font.monoMed,
      fontSize: 56,
      lineHeight: 60,
      letterSpacing: -1.5,
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
    title: { fontFamily: font.sansSemi, fontSize: 22, lineHeight: 28, color: colors.ink },
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

export const radius = { card: 12, chip: 999, sheet: 20 };

/** Screen horizontal padding. The same everywhere, no exceptions. */
export const gutter = 20;

/**
 * Elevation is none in either theme. Separation comes from hairlines and
 * paper-vs-surface contrast. The one exception is the tab bar, which gets a
 * hairline top border rather than a shadow.
 */
export function createHairlineBorder(colors: Palette) {
  return {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  };
}
