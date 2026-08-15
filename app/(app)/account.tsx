import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountText } from '@/src/components/AmountText';
import { Icon } from '@/src/components/Icon';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { usePurchases } from '@/src/hooks/usePurchases';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTheme, type ThemeModePreference } from '@/src/hooks/useTheme';
import {
  darkColors,
  font,
  gutter,
  lightColors,
  radius,
  space,
  type Palette,
  type TextStyles,
} from '@/src/theme';
import { monthlyTotal } from '@/src/utils/money';

const APPEARANCE_OPTIONS: { value: ThemeModePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
];

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isPro, managementUrl } = usePurchases();
  const { data: subscriptions } = useSubscriptions();
  const { colors, text: t, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const subs = useMemo(() => subscriptions ?? [], [subscriptions]);

  const stats = useMemo(() => {
    const monthly = monthlyTotal(subs);
    return { total: subs.length, monthly, yearly: monthly * 12 };
  }, [subs]);

  const currency = subs[0]?.currency ?? 'INR';
  // A session restored from a stored token has no profile until the API returns
  // one, so the email can legitimately be empty here.
  const email = user?.email?.trim();
  const initial = (email?.trim()[0] ?? '?').toUpperCase();

  function handleLogout() {
    Alert.alert('Log out?', "You'll need to sign in again to see your mandates.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function handlePlanPress() {
    if (isPro && managementUrl) Linking.openURL(managementUrl);
    else router.push('/paywall');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.sm, paddingBottom: space.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Settings"
        caption="Your identity, plan, and how the ledger looks."
        dismiss="back"
      />

      {/* --- Membership card: identity + plan status fused into one instrument --- */}
      <Pressable
        onPress={handlePlanPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            </View>

            <View style={styles.cardIdentity}>
              <Text style={styles.email} numberOfLines={1}>
                {email || 'Signed in'}
              </Text>
              <Text style={styles.tracked}>
                {stats.total} {stats.total === 1 ? 'mandate' : 'mandates'} tracked
              </Text>
            </View>

            <View style={[styles.tierBadge, isPro && styles.tierBadgePro]}>
              <Text style={[styles.tierBadgeText, isPro && styles.tierBadgeTextPro]}>
                {isPro ? 'PRO' : 'FREE'}
              </Text>
            </View>
          </View>

          <View style={styles.cardRule} />

          <View style={styles.cardFooter}>
            {isPro ? (
              <>
                <Icon name="checkmark-circle" size={15} color={colors.saved} />
                <Text style={styles.cardFooterText}>Active — tap to manage</Text>
              </>
            ) : (
              <>
                <Icon name="flash" size={15} color={colors.cyan} />
                <Text style={styles.cardFooterText}>Unlock price alerts &amp; exports</Text>
              </>
            )}
            <Icon
              name="chevron-forward"
              size={15}
              color={colors.faint}
              style={styles.cardChevron}
            />
          </View>
        </View>
      </Pressable>

      <SectionHeader label="Appearance" />
      <View style={styles.swatchRow}>
        {APPEARANCE_OPTIONS.map((opt) => {
          const active = mode === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={styles.swatchSlot}
              accessibilityRole="button"
              accessibilityLabel={`${opt.label} appearance`}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.swatchFrame, active && styles.swatchFrameActive]}>
                <ThemeSwatchPreview mode={opt.value} />
              </View>
              <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader label="Spending" />
      <View style={styles.statTile}>
        <View style={styles.statHalf}>
          <Text style={t.label}>Per month</Text>
          <AmountText value={stats.monthly} currency={currency} size={26} style={styles.statValue} />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statHalf}>
          <Text style={t.label}>Per year</Text>
          <AmountText value={stats.yearly} currency={currency} size={26} style={styles.statValue} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handleLogout} hitSlop={8}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
        <Text style={styles.version}>subsTrack · 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

/** A live, tiny render of what each appearance mode actually looks like — not a text label pretending to be one. */
function ThemeSwatchPreview({ mode }: { mode: ThemeModePreference }) {
  if (mode === 'system') {
    return (
      <View style={[StyleSheet.absoluteFill, swatchStyles.split]}>
        <View style={[swatchStyles.splitHalf, { backgroundColor: lightColors.paper }]}>
          <View style={[swatchStyles.dot, { backgroundColor: lightColors.indigo }]} />
        </View>
        <View style={[swatchStyles.splitHalf, { backgroundColor: darkColors.paper }]}>
          <View style={[swatchStyles.line, { backgroundColor: darkColors.ink }]} />
        </View>
      </View>
    );
  }
  const p = mode === 'light' ? lightColors : darkColors;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: p.paper }]}>
      <View style={swatchStyles.content}>
        <View style={[swatchStyles.chip, { backgroundColor: p.surface, borderColor: p.hairline }]}>
          <View style={[swatchStyles.dot, { backgroundColor: p.indigo }]} />
        </View>
        <View style={[swatchStyles.line, { backgroundColor: p.ink, opacity: 0.85 }]} />
        <View style={[swatchStyles.line, { width: '45%', backgroundColor: p.muted }]} />
      </View>
    </View>
  );
}

const swatchStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  split: {
    flexDirection: 'row',
  },
  splitHalf: {
    flex: 1,
    padding: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chip: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    height: 3,
    borderRadius: 2,
    width: '70%',
  },
});

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      paddingHorizontal: gutter,
      flexGrow: 1,
    },

    // Membership card
    card: {
      marginTop: space.lg,
      borderRadius: radius.card,
    },
    cardPressed: {
      opacity: 0.88,
    },
    cardInner: {
      borderRadius: radius.card,
      backgroundColor: colors.elevated,
      borderWidth: 1.5,
      borderColor: colors.indigo,
      padding: space.lg,
      overflow: 'hidden',
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    avatarRing: {
      width: 52,
      height: 52,
      borderRadius: 26,
      padding: 2,
      backgroundColor: colors.indigo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontFamily: font.monoMed,
      fontSize: 18,
      color: colors.ink,
    },
    cardIdentity: {
      flex: 1,
      gap: 3,
    },
    email: {
      fontFamily: font.sansMed,
      fontSize: 16,
      color: colors.ink,
    },
    tracked: {
      ...t.caption,
    },
    tierBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radius.chip,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    tierBadgePro: {
      borderColor: 'transparent',
      backgroundColor: colors.indigoBg,
    },
    tierBadgeText: {
      fontFamily: font.monoMed,
      fontSize: 10,
      letterSpacing: 1,
      color: colors.faint,
    },
    tierBadgeTextPro: {
      color: colors.indigo,
    },
    cardRule: {
      height: 1,
      backgroundColor: colors.hairline,
      marginVertical: space.md,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
    },
    cardFooterText: {
      ...t.caption,
      color: colors.muted,
      flex: 1,
    },
    cardChevron: {
      marginLeft: -space.xs,
    },

    // Appearance swatches
    swatchRow: {
      flexDirection: 'row',
      gap: space.sm,
      marginTop: space.sm,
    },
    swatchSlot: {
      flex: 1,
      alignItems: 'center',
      gap: space.xs,
    },
    swatchFrame: {
      width: '100%',
      height: 56,
      borderRadius: radius.cardSm,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    swatchFrameActive: {
      borderColor: colors.indigo,
      borderWidth: 1.5,
    },
    swatchLabel: {
      fontFamily: font.sans,
      fontSize: 12,
      color: colors.faint,
    },
    swatchLabelActive: {
      fontFamily: font.sansMed,
      color: colors.ink,
    },

    // Spending stat tile
    statTile: {
      flexDirection: 'row',
      marginTop: space.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: space.lg,
    },
    statHalf: {
      flex: 1,
      gap: space.xs,
    },
    statValue: {
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.hairline,
      marginHorizontal: space.lg,
    },

    // Footer
    footer: {
      marginTop: space.xxl,
      alignItems: 'center',
      gap: space.sm,
    },
    logout: {
      fontFamily: font.sansMed,
      fontSize: 14,
      color: colors.debit,
    },
    version: {
      fontFamily: font.mono,
      fontSize: 11,
      color: colors.faint,
      letterSpacing: 0.4,
    },
  });
