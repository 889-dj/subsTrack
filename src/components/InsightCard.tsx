import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/src/components/Icon';
import { useTheme } from '@/src/hooks/useTheme';
import { radius, space, type Palette, type TextStyles } from '@/src/theme';

interface InsightCardProps {
  icon: IconName;
  title: string;
  body: string;
  accent?: 'indigo' | 'cyan' | 'pink' | 'warning' | 'saved';
}

/** Small card: icon tile + short generated observation. Used on the Insights tab. */
export function InsightCard({ icon, title, body, accent = 'indigo' }: InsightCardProps) {
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const accentColor = colors[accent];

  return (
    <View style={styles.card}>
      <View style={[styles.iconTile, { backgroundColor: `${accentColor}1F` }]}>
        <Icon name={icon} size={18} color={accentColor} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: space.md,
      backgroundColor: colors.surface,
      borderRadius: radius.cardSm,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.lg,
      marginBottom: space.sm,
    },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 3,
    },
    title: {
      ...t.body,
      fontSize: 14.5,
    },
    body: {
      ...t.caption,
    },
  });
