import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { font, radius, space, type Palette } from '@/src/theme';

interface StatPillProps {
  label: string;
  icon?: IconName;
  /** 'up' green, 'down'/'flat' neutral — used for the delta pill only. */
  tone?: 'neutral' | 'positive' | 'negative';
}

/** Small glass pill used on the hero card for quick stats and the delta badge. */
export function StatPill({ label, icon, tone = 'neutral' }: StatPillProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toneColor =
    tone === 'positive' ? colors.saved : tone === 'negative' ? colors.debit : colors.muted;

  return (
    <View style={[styles.pill, tone !== 'neutral' && { backgroundColor: `${toneColor}1F` }]}>
      {icon ? <Icon name={icon} size={12} color={toneColor} style={styles.icon} /> : null}
      <Text style={[styles.text, tone !== 'neutral' && { color: toneColor }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space.md,
      paddingVertical: 7,
      borderRadius: radius.chip,
      backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : colors.paper2,
      alignSelf: 'flex-start',
    },
    icon: {
      marginRight: 4,
    },
    text: {
      fontFamily: font.sansMed,
      fontSize: 12.5,
      color: colors.muted,
    },
  });
