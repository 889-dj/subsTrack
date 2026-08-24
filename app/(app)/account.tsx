import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountText } from '@/src/components/AmountText';
import { Icon, type IconName } from '@/src/components/Icon';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useAuth } from '@/src/hooks/useAuth';
import { usePurchases } from '@/src/hooks/usePurchases';
import { useSubscriptions } from '@/src/hooks/useSubscriptions';
import { useTheme, type ThemeModePreference } from '@/src/hooks/useTheme';
import { font, gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';
import { monthlyTotal, scopeSubscriptionsByCurrency } from '@/src/utils/money';

const APPEARANCE_OPTIONS: {
  value: ThemeModePreference;
  label: string;
  icon: IconName;
}[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'Auto', icon: 'system' },
];

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const { isPro, managementUrl } = usePurchases();
  const { data: subscriptions } = useSubscriptions();
  const { colors, text: t, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [isDeleting, setIsDeleting] = useState(false);

  const subs = useMemo(() => subscriptions ?? [], [subscriptions]);
  const activeCount = useMemo(
    () => subs.filter((subscription) => subscription.status === 'active').length,
    [subs],
  );
  const currencyScope = useMemo(() => scopeSubscriptionsByCurrency(subs), [subs]);
  const stats = useMemo(() => {
    const monthly = monthlyTotal(currencyScope.included);
    return { total: activeCount, monthly, yearly: monthly * 12 };
  }, [activeCount, currencyScope.included]);

  const currency = currencyScope.currency;
  const email = user?.email?.trim();
  const initial = email?.[0]?.toUpperCase();

  function handleLogout() {
    Alert.alert('Log out?', "You'll need to sign in again to see your subscriptions.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and tracked subscriptions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
            } catch (error: any) {
              setIsDeleting(false);
              Alert.alert(
                'Could not delete account',
                error?.response?.data?.message ?? 'Please check your connection and try again.',
              );
            }
          },
        },
      ],
    );
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
        { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Account"
        caption="Plan, appearance, and account controls."
        dismiss="back"
      />

      <Pressable
        onPress={handlePlanPress}
        accessibilityRole="button"
        accessibilityLabel={isPro ? 'Manage SubsTrack Pro' : 'Explore SubsTrack Pro'}
        accessibilityHint={isPro ? 'Opens subscription management' : 'Opens available Pro plans'}
        style={({ pressed }) => [styles.pass, pressed && styles.pressed]}
      >
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            {initial ? (
              <Text style={styles.avatarInitial}>{initial}</Text>
            ) : (
              <Icon name="user" size={23} color={colors.heroInk} strokeWidth={1.7} />
            )}
          </View>

          <View style={styles.identityCopy}>
            <Text style={styles.identityTitle} numberOfLines={1}>
              {email || 'Your account'}
            </Text>
            <Text style={styles.identityCaption}>
              {stats.total} active {stats.total === 1 ? 'subscription' : 'subscriptions'}
            </Text>
          </View>

          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
          </View>
        </View>

        <View style={styles.passRule} />

        <View style={styles.spendingRow}>
          <View style={styles.spendingItem}>
            <Text style={styles.passLabel}>MONTHLY</Text>
            <AmountText
              value={stats.monthly}
              currency={currency}
              size={23}
              tone="hero"
              numberOfLines={1}
            />
          </View>
          <View style={styles.spendingDivider} />
          <View style={styles.spendingItem}>
            <Text style={styles.passLabel}>YEARLY</Text>
            <AmountText
              value={stats.yearly}
              currency={currency}
              size={23}
              tone="hero"
              numberOfLines={1}
            />
          </View>
        </View>

        {currencyScope.excludedCount > 0 ? (
          <Text style={styles.passScope}>
            {currency} totals · {currencyScope.excludedCount} in{' '}
            {currencyScope.excludedCurrencies.join(', ')} shown separately
          </Text>
        ) : null}

        <View style={styles.planAction}>
          <Icon
            name={isPro ? 'checkmark-circle' : 'flash'}
            size={16}
            color={colors.heroInk}
          />
          <Text style={styles.planActionText}>{isPro ? 'Manage plan' : 'Explore Pro'}</Text>
          <Icon name="chevron-forward" size={16} color={colors.heroInk} />
        </View>
      </Pressable>

      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.appearanceControl} accessibilityRole="radiogroup">
        {APPEARANCE_OPTIONS.map((option) => {
          const active = mode === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setMode(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label} appearance`}
              accessibilityState={{ checked: active }}
              style={({ pressed }) => [
                styles.appearanceOption,
                active && styles.appearanceOptionActive,
                pressed && styles.pressed,
              ]}
            >
              <Icon
                name={option.icon}
                size={18}
                color={active ? colors.indigo : colors.faint}
              />
              <Text style={[styles.appearanceLabel, active && styles.appearanceLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.actionGroup}>
        <SettingsRow
          icon="logout"
          label="Log out"
          onPress={handleLogout}
          disabled={isDeleting}
          colors={colors}
          styles={styles}
        />
        <View style={styles.actionRule} />
        <SettingsRow
          icon="delete"
          label={isDeleting ? 'Deleting account…' : 'Delete account'}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          danger
          colors={colors}
          styles={styles}
        />
      </View>

      <Text style={styles.version}>subsTrack · 1.0.0</Text>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  disabled,
  danger = false,
  colors,
  styles,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled: boolean;
  danger?: boolean;
  colors: Palette;
  styles: ReturnType<typeof createStyles>;
}) {
  const tint = danger ? colors.debit : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={danger ? 'Delete account permanently' : label}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && styles.actionRowPressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        <Icon name={icon} size={19} color={tint} />
      </View>
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
      {!danger ? <Icon name="chevron-forward" size={17} color={colors.faint} /> : null}
    </Pressable>
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
    pressed: {
      opacity: 0.86,
    },
    pass: {
      marginTop: space.lg,
      padding: space.lg,
      borderRadius: radius.card,
      backgroundColor: colors.heroSurface,
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarInitial: {
      fontFamily: font.monoMed,
      fontSize: 19,
      color: colors.heroInk,
    },
    identityCopy: {
      flex: 1,
      gap: 2,
    },
    identityTitle: {
      fontFamily: font.sansSemi,
      fontSize: 17,
      lineHeight: 22,
      color: colors.heroInk,
    },
    identityCaption: {
      ...t.caption,
      color: colors.heroMuted,
    },
    planBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.chip,
      backgroundColor: 'rgba(255,255,255,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    planBadgeText: {
      fontFamily: font.monoMed,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 1,
      color: colors.heroInk,
    },
    passRule: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.16)',
      marginTop: space.lg,
      marginBottom: space.md,
    },
    spendingRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    spendingItem: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    spendingDivider: {
      width: 1,
      marginHorizontal: space.md,
      backgroundColor: 'rgba(255,255,255,0.16)',
    },
    passLabel: {
      fontFamily: font.mono,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 1,
      color: colors.heroMuted,
    },
    passScope: {
      marginTop: space.md,
      fontFamily: font.sans,
      fontSize: 11,
      lineHeight: 15,
      color: colors.heroMuted,
    },
    planAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      minHeight: 42,
      marginTop: space.lg,
      paddingHorizontal: space.md,
      borderRadius: radius.cardSm,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    planActionText: {
      flex: 1,
      fontFamily: font.sansMed,
      fontSize: 14,
      color: colors.heroInk,
    },
    sectionTitle: {
      ...t.section,
      marginTop: space.xxl,
      marginBottom: space.md,
    },
    appearanceControl: {
      flexDirection: 'row',
      padding: space.xs,
      gap: space.xs,
      borderRadius: radius.cardSm,
      backgroundColor: colors.paper2,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    appearanceOption: {
      flex: 1,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: radius.cardSm - 3,
    },
    appearanceOptionActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    appearanceLabel: {
      fontFamily: font.sansMed,
      fontSize: 13,
      color: colors.faint,
    },
    appearanceLabelActive: {
      color: colors.ink,
    },
    actionGroup: {
      overflow: 'hidden',
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    actionRow: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: space.md,
      gap: space.md,
    },
    actionRowPressed: {
      backgroundColor: colors.paper2,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.paper2,
    },
    actionIconDanger: {
      backgroundColor: colors.isDark ? 'rgba(255,107,122,0.1)' : 'rgba(192,68,61,0.08)',
    },
    actionLabel: {
      flex: 1,
      fontFamily: font.sansMed,
      fontSize: 15,
      color: colors.ink,
    },
    actionLabelDanger: {
      color: colors.debit,
    },
    actionRule: {
      height: 1,
      marginLeft: space.md + 36 + space.md,
      backgroundColor: colors.hairline,
    },
    disabled: {
      opacity: 0.5,
    },
    version: {
      marginTop: space.lg,
      textAlign: 'center',
      fontFamily: font.mono,
      fontSize: 11,
      lineHeight: 15,
      color: colors.faint,
      letterSpacing: 0.4,
    },
  });
