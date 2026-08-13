import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AmountText } from '@/src/components/AmountText';
import { Button } from '@/src/components/Button';
import { KeyValueRow } from '@/src/components/KeyValueRow';
import { Logo } from '@/src/components/Logo';
import { SectionHeader } from '@/src/components/SectionHeader';
import { TAB_BAR_CLEARANCE } from '@/src/components/StatementTabBar';
import { useAuth } from '@/src/hooks/useAuth';
import { usePurchases } from '@/src/hooks/usePurchases';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTheme } from '@/src/hooks/useTheme';
import { font, gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyTotal } from '@/src/utils/money';

const APPEARANCE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

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
    return {
      total: subs.length,
      monthly,
      yearly: monthly * 12,
    };
  }, [subs]);

  const currency = subs[0]?.currency ?? 'INR';

  // A session restored from a stored token has no profile until the API returns
  // one, so the email can legitimately be empty here.
  const email = user?.email?.trim();

  function handleLogout() {
    Alert.alert('Log out?', "You'll need to sign in again to see your mandates.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: TAB_BAR_CLEARANCE + space.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={t.title}>Settings</Text>

      <View style={styles.profile}>
        <Logo name={email || '?'} size={44} />
        <View style={styles.profileText}>
          <Text style={t.body} numberOfLines={1}>
            {email || 'Signed in'}
          </Text>
          <Text style={t.caption}>
            {stats.total} {stats.total === 1 ? 'mandate' : 'mandates'} tracked
          </Text>
        </View>
      </View>

      <SectionHeader label="Plan" />
      <Pressable
        onPress={() =>
          isPro && managementUrl ? Linking.openURL(managementUrl) : router.push('/paywall')
        }
        style={({ pressed }) => [styles.planRow, pressed && styles.pressed]}
      >
        <View style={styles.planText}>
          <Text style={t.body}>{isPro ? 'SubsTrack Pro' : 'Unlock everything'}</Text>
          <Text style={t.caption}>
            {isPro ? 'Active — tap to manage' : 'One payment. Price alerts and exports.'}
          </Text>
        </View>
        {isPro ? <Ionicons name="checkmark" size={16} color={colors.saved} /> : null}
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>

      <SectionHeader label="Appearance" />
      <View style={styles.segmentGroup}>
        {APPEARANCE_OPTIONS.map((opt) => {
          const active = mode === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader label="Spending" />
      <KeyValueRow label="Per month">
        <AmountText value={stats.monthly} currency={currency} />
      </KeyValueRow>
      <KeyValueRow label="Per year" last>
        <AmountText value={stats.yearly} currency={currency} />
      </KeyValueRow>

      <Button label="Log out" variant="secondary" onPress={handleLogout} style={styles.logout} />
    </ScrollView>
  );
}

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
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      marginTop: space.lg,
      padding: space.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    profileText: {
      flex: 1,
      gap: 2,
    },
    planRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingVertical: space.md + 2,
    },
    planText: {
      flex: 1,
      gap: 2,
    },
    segmentGroup: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      marginTop: space.sm,
    },
    segment: {
      flex: 1,
      paddingVertical: space.md + 2,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: colors.indigoBg,
    },
    segmentText: {
      ...t.body,
      color: colors.muted,
    },
    segmentTextActive: {
      color: colors.indigo,
      fontFamily: font.sansMed,
    },
    logout: {
      marginTop: space.xxl,
    },
    pressed: {
      opacity: 0.6,
    },
  });
