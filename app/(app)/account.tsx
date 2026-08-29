import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmountText } from '@/src/components/AmountText';
import { Icon, type IconName } from '@/src/components/Icon';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useOverview, useSpendHeadline } from '@/src/hooks/useAnalytics';
import { useAuth } from '@/src/hooks/useAuth';
import {
  useDeleteAvatar,
  useMe,
  useRegisterPushToken,
  useUnregisterPushToken,
  useUploadAvatar,
} from '@/src/hooks/useMe';
import { usePurchases } from '@/src/hooks/usePurchases';
import { useTheme, type ThemeModePreference } from '@/src/hooks/useTheme';
import { pickImage } from '@/src/lib/imagePicker';
import { registerForPushNotifications } from '@/src/lib/notifications';
import { font, gutter, radius, space, type Palette, type TextStyles } from '@/src/theme';

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
  const { data: overview } = useOverview();
  const { data: me } = useMe();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();
  const registerPushTokenMutation = useRegisterPushToken();
  const unregisterPushTokenMutation = useUnregisterPushToken();
  const { colors, text: t, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const avatarUrl = me?.avatarUrl ?? undefined;
  const isUpdatingAvatar = uploadAvatarMutation.isPending || deleteAvatarMutation.isPending;
  const isUpdatingNotifications =
    registerPushTokenMutation.isPending || unregisterPushTokenMutation.isPending;
  useEffect(() => setAvatarLoadFailed(false), [avatarUrl]);

  const { currency, monthly, yearly, totalActiveCount, note: otherCurrenciesNote } =
    useSpendHeadline(overview);
  const stats = { total: totalActiveCount, monthly, yearly };
  const email = user?.email?.trim();
  const initial = email?.[0]?.toUpperCase();

  async function pickAndUploadPhoto() {
    const outcome = await pickImage();
    switch (outcome.status) {
      case 'unavailable':
        Alert.alert(
          'Update needed',
          'Photo uploads need a newer build of the app. This will work once you update.',
        );
        return;
      case 'permission-denied':
        Alert.alert(
          'Photo access needed',
          'Allow photo library access in Settings to set a profile picture.',
        );
        return;
      case 'unsupported-type':
        Alert.alert("Can't use this photo", 'Choose a JPEG, PNG, or WEBP image.');
        return;
      case 'cancelled':
        return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(outcome.image);
    } catch {
      Alert.alert("Couldn't update photo", 'Please check your connection and try again.');
    }
  }

  function handleChangePhoto() {
    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Choose Photo', onPress: pickAndUploadPhoto },
    ];
    if (avatarUrl) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          deleteAvatarMutation.mutate(undefined, {
            onError: () =>
              Alert.alert("Couldn't remove photo", 'Please check your connection and try again.'),
          });
        },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', undefined, options);
  }

  async function handleToggleNotifications() {
    if (me?.pushNotificationsEnabled) {
      unregisterPushTokenMutation.mutate(undefined, {
        onError: () =>
          Alert.alert("Couldn't turn off reminders", 'Please check your connection and try again.'),
      });
      return;
    }

    const outcome = await registerForPushNotifications();
    switch (outcome.status) {
      case 'unavailable':
        Alert.alert('Update needed', 'Renewal reminders need a newer build of the app.');
        return;
      case 'unsupported-device':
        Alert.alert('Not available', 'Push notifications need a physical device, not a simulator.');
        return;
      case 'permission-denied':
        Alert.alert(
          'Notifications blocked',
          'Allow notifications in Settings to get renewal reminders.',
        );
        return;
      case 'registered':
        registerPushTokenMutation.mutate(outcome.token, {
          onError: () =>
            Alert.alert("Couldn't turn on reminders", 'Please check your connection and try again.'),
        });
    }
  }

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
          <Pressable
            onPress={handleChangePhoto}
            disabled={isUpdatingAvatar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={styles.avatar}
          >
            {isUpdatingAvatar ? (
              <ActivityIndicator size="small" color={colors.heroInk} />
            ) : avatarUrl && !avatarLoadFailed ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : initial ? (
              <Text style={styles.avatarInitial}>{initial}</Text>
            ) : (
              <Icon name="user" size={23} color={colors.heroInk} strokeWidth={1.7} />
            )}
          </Pressable>

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

        {otherCurrenciesNote ? (
          <Text style={styles.passScope}>{currency} totals · {otherCurrenciesNote}</Text>
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

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.actionGroup}>
        <SettingsRow
          icon="notifications-outline"
          label={
            me?.pushNotificationsEnabled
              ? 'Renewal reminders — On'
              : 'Renewal reminders — Off'
          }
          onPress={handleToggleNotifications}
          disabled={isUpdatingNotifications}
          colors={colors}
          styles={styles}
        />
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
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
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
