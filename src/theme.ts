export const colors = {
  background: '#F7F8FC',
  surface: '#FFFFFF',
  border: '#E4E7EF',
  text: '#14171F',
  textMuted: '#6B7080',
  textFaint: '#9498A6',
  accent: '#5B5FEF',
  accentMuted: '#EDEEFD',
  danger: '#E5484D',
  dangerMuted: '#FBEAEA',
  success: '#2FA76F',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodyMuted: { fontSize: 14, fontWeight: '400' as const, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textFaint },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
};

export const shadow = {
  card: {
    shadowColor: '#14171F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};
