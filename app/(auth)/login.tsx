import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/hooks/useTheme';
import { font, gutter, space, type Palette, type TextStyles } from '@/src/theme';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    login,
    register,
    verificationPending,
    verificationEmail,
    verifyEmail,
    resendVerification,
    cancelVerification,
  } = useAuth();
  const router = useRouter();
  const { colors, text: t } = useTheme();
  const styles = useMemo(() => createStyles(colors, t), [colors, t]);

  const isRegister = mode === 'register';

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Fill in both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const credentials = { email: email.trim(), password };
      const result = isRegister
        ? await register(credentials)
        : await login(credentials);
      if (result === 'authenticated') router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerification() {
    setError(null);
    if (!verificationCode.trim()) {
      setError('Enter the verification code from your email.');
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmail(verificationCode.trim());
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Could not verify that code.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.wordmark}>SUBSTRACK</Text>
          <Text style={styles.title}>
            {verificationPending
              ? 'Check your email.'
              : isRegister
                ? 'See every recurring charge in one place.'
                : 'Welcome back.'}
          </Text>
          <Text style={styles.subtitle}>
            {verificationPending
              ? `Enter the code sent to ${verificationEmail ?? 'your email'}.`
              : isRegister
                ? 'Create an account to track renewal dates and recurring totals.'
                : 'Your subscription ledger is ready.'}
          </Text>

          <View style={styles.form}>
            {verificationPending ? (
              <TextField
                label="Verification code"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="123456"
              />
            ) : (
              <>
                <TextField
                  label="Email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                />
                <TextField
                  label="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={verificationPending ? 'Verify email' : isRegister ? 'Create account' : 'Log in'}
              onPress={verificationPending ? handleVerification : handleSubmit}
              loading={submitting}
            />
          </View>

          {verificationPending ? (
            <View style={styles.verificationActions}>
              <Pressable
                onPress={async () => {
                  try {
                    await resendVerification();
                    setError(null);
                    Alert.alert('Code sent', 'A new verification code is on its way.');
                  } catch (e: any) {
                    setError(e?.message ?? 'Could not resend the code.');
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Resend verification code"
              >
                <Text style={styles.toggleLink}>Resend code</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await cancelVerification();
                  setVerificationCode('');
                  setError(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Use another email address"
              >
                <Text style={styles.toggleText}>Use another email</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setError(null);
                setMode(isRegister ? 'login' : 'register');
              }}
              style={styles.toggle}
              accessibilityRole="button"
              accessibilityLabel={isRegister ? 'Switch to log in' : 'Switch to sign up'}
            >
              <Text style={styles.toggleText}>
                {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.toggleLink}>{isRegister ? 'Log in' : 'Sign up'}</Text>
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: Palette, t: TextStyles) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: gutter,
      paddingVertical: space.xxl,
    },
    wordmark: {
      fontFamily: font.monoMed,
      fontSize: 11,
      letterSpacing: 2,
      color: colors.indigo,
      marginBottom: space.lg,
    },
    title: {
      fontFamily: font.sansSemi,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.7,
      color: colors.ink,
      marginBottom: space.xs,
    },
    subtitle: {
      ...t.body,
      color: colors.muted,
      marginBottom: space.xl,
    },
    form: {
      marginBottom: space.lg,
      gap: 0,
    },
    error: {
      ...t.caption,
      color: colors.debit,
      marginBottom: space.md,
    },
    toggle: {
      alignItems: 'center',
    },
    verificationActions: {
      alignItems: 'center',
      gap: space.md,
    },
    toggleText: {
      ...t.caption,
    },
    toggleLink: {
      color: colors.indigo,
      fontFamily: font.sansMed,
    },
  });
