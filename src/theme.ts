import type { TextStyle } from 'react-native';

/**
 * The visual world here is the bank statement and the debit SMS — not a
 * fintech dashboard. Mono descriptors, right-aligned tabular amounts,
 * hairline rules, paper background, no shadows.
 */
export const color = {
  paper: '#F2F3F0', // cool recycled-statement grey-white, app background
  surface: '#FFFFFF', // cards
  ink: '#16181A', // primary text
  muted: '#6B6F76', // labels, secondary
  hairline: '#DEDFDA', // 1px rules, borders
  indigo: '#2A2F6B', // brand — stamp ink. Buttons, active states, brand marks
  indigoBg: '#E7E8F0', // indigo tint for chips/badges
  /** ONLY money going out. Never decorative. */
  debit: '#B23A2F',
  /** ONLY the saved total. Never decorative. */
  saved: '#2F6B4F',
  savedBg: '#E4EDE8',
  white: '#FFFFFF',
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

const scale = {
  /** The reveal number. */
  hero: {
    fontFamily: font.monoMed,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.5,
    color: color.ink,
    ...tabular,
  },
  /** Home header total. */
  total: {
    fontFamily: font.monoMed,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: color.ink,
    ...tabular,
  },
  title: { fontFamily: font.sansSemi, fontSize: 22, lineHeight: 28, color: color.ink },
  body: { fontFamily: font.sans, fontSize: 15, lineHeight: 22, color: color.ink },
  /** Row amounts. */
  amount: { fontFamily: font.mono, fontSize: 15, lineHeight: 22, color: color.ink, ...tabular },
  label: {
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: color.muted,
  },
  caption: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: color.muted },
} satisfies Record<string, TextStyle>;

/**
 * `text` and `type` are the same scale. `text` is what the app imports —
 * a named import called `type` collides with TypeScript's inline type-import
 * syntax and reads badly at call sites.
 */
export const text = scale;
export const type = scale;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };

export const radius = { card: 12, chip: 999, sheet: 20 };

/** Screen horizontal padding. The same everywhere, no exceptions. */
export const gutter = 20;

/**
 * Elevation is none. Separation comes from hairlines and paper-vs-surface
 * contrast. The one exception is the tab bar, which gets a hairline top
 * border rather than a shadow.
 */
export const hairlineBorder = {
  borderBottomWidth: 1,
  borderBottomColor: color.hairline,
};
