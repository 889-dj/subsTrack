import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { FLOATING_TAB_BAR_HEIGHT } from '@/src/components/FloatingTabBar';
import { useAuth } from '@/src/hooks/useAuth';
import { usePurchases } from '@/src/hooks/usePurchases';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { colors, radius, spacing, typography } from '@/src/theme';
import { formatMoney, monthlyTotal } from '@/src/utils/money';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isPro, managementUrl } = usePurchases();
  const { data: subscriptions } = useSubscriptions();

  const subs = useMemo(() => subscriptions ?? [], [subscriptions]);

  const stats = useMemo(() => {
    const imported = subs.filter((s) => s.source === 'statement').length;
    return {
      total: subs.length,
      imported,
      manual: subs.length - imported,
      monthly: monthlyTotal(subs),
      yearly: monthlyTotal(subs) * 12,
    };
  }, [subs]);

  const currency = subs[0]?.currency ?? 'INR';

  // A session restored from a stored token has no profile until the API returns
  // one, so the email can legitimately be empty here.
  const email = user?.email?.trim();
  const initial = (email?.[0] ?? '?').toUpperCase();

  function handleLogout() {
    Alert.alert('Log out?', "You'll need to sign in again to see your subscriptions.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: FLOATING_TAB_BAR_HEIGHT + spacing.xl },
      ]}
    >
      <Text style={styles.title}>Account</Text>

      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.email} numberOfLines={1}>
            {email || 'Signed in'}
          </Text>
          <Text style={styles.profileMeta}>
            {stats.total} {stats.total === 1 ? 'subscription' : 'subscriptions'} tracked
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Plan</Text>
      <Pressable
        onPress={() => (isPro && managementUrl ? Linking.openURL(managementUrl) : router.push('/paywall'))}
      >
        <Card style={[styles.planCard, isPro && styles.planCardPro]}>
          <View style={[styles.planIcon, isPro && styles.planIconPro]}>
            <Ionicons
              name={isPro ? 'checkmark-circle' : 'sparkles'}
              size={20}
              color={isPro ? colors.success : colors.accent}
            />
          </View>
          <View style={styles.planText}>
            <Text style={styles.planTitle}>{isPro ? 'SubsTrack Pro' : 'Upgrade to Pro'}</Text>
            <Text style={styles.planSubtitle}>
              {isPro
                ? 'Active — tap to manage or cancel'
                : 'Renewal reminders, price alerts and unlimited uploads'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </Card>
      </Pressable>

      <Text style={styles.sectionLabel}>Spending</Text>
      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Per month</Text>
          <Text style={styles.statValue}>{formatMoney(stats.monthly, currency)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Per year</Text>
          <Text style={styles.statValue}>{formatMoney(stats.yearly, currency)}</Text>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Where they came from</Text>
      <Card style={styles.statsCard}>
        <SourceRow
          icon="scan-circle-outline"
          label="Found in statements"
          count={stats.imported}
        />
        <View style={styles.divider} />
        <SourceRow icon="create-outline" label="Added manually" count={stats.manual} />
      </Card>

      <Button
        label="Log out"
        variant="danger"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

function SourceRow({
  icon,
  label,
  count,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  count: number;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.sourceLeft}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  profileText: {
    flex: 1,
  },
  email: {
    ...typography.subheading,
    marginBottom: 2,
  },
  profileMeta: {
    ...typography.bodyMuted,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCardPro: {
    borderWidth: 1,
    borderColor: colors.success,
  },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconPro: {
    backgroundColor: colors.background,
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    ...typography.subheading,
    marginBottom: 2,
  },
  planSubtitle: {
    ...typography.bodyMuted,
  },
  statsCard: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
  },
  sourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statLabel: {
    ...typography.body,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.subheading,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
});
