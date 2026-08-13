import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { CURRENCIES } from '@/src/types';

const CURRENCY_SYMBOLS: Record<string, string> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c.symbol])
);

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

interface AmountTextProps {
  value: number;
  currency: string;
  /** Prefix with ≈ for a converted foreign-currency charge. */
  approx?: boolean;
  /** Drop the paise/cents. Row amounts do; detail values don't. */
  round?: boolean;
  style?: TextStyle | TextStyle[];
  /** Colour override — only ever `debit` or `saved`, and only when it means it. */
  tone?: 'ink' | 'muted' | 'debit' | 'saved';
  numberOfLines?: number;
  /** Digit size. The symbol is derived from it, never set directly. */
  size?: number;
}

/**
 * The currency symbol sits at 0.65em and one step lighter so the digits carry
 * the row. Everything is tabular so the amount column lines up down the page.
 */
export function AmountText({
  value,
  currency,
  approx = false,
  round = true,
  style,
  tone = 'ink',
  numberOfLines,
  size = 15,
}: AmountTextProps) {
  const { colors, text: t } = useTheme();
  const TONES = {
    ink: colors.ink,
    muted: colors.muted,
    debit: colors.debit,
    saved: colors.saved,
  };

  const digits = round
    ? Math.round(value).toLocaleString('en-IN')
    : value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const symbol = { fontSize: Math.round(size * 0.65), color: colors.muted };

  return (
    <Text
      style={[t.amount, { fontSize: size, color: TONES[tone] }, style]}
      numberOfLines={numberOfLines}
    >
      {approx ? <Text style={symbol}>≈</Text> : null}
      <Text style={symbol}>{currencySymbol(currency)}</Text>
      {digits}
    </Text>
  );
}
