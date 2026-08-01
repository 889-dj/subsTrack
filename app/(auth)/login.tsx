import React, { useState } from 'react';
import {
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
import { colors, spacing, typography } from '@/src/theme';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();
  const router = useRouter();

  const isRegister = mode === 'register';

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const credentials = { email: email.trim(), password };
      if (isRegister) {
        await register(credentials);
      } else {
        await login(credentials);
      }
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>SubTracker</Text>
          <Text style={styles.title}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Track every subscription in one place.'
              : 'Log in to see what you’re spending.'}
          </Text>

          <View style={styles.form}>
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

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              label={isRegister ? 'Create account' : 'Log in'}
              onPress={handleSubmit}
              loading={submitting}
              style={styles.submitButton}
            />
          </View>

          <Pressable
            onPress={() => {
              setError(null);
              setMode(isRegister ? 'login' : 'register');
            }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleLink}>{isRegister ? 'Log in' : 'Sign up'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  brand: {
    ...typography.label,
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  toggle: {
    alignItems: 'center',
  },
  toggleText: {
    ...typography.bodyMuted,
  },
  toggleLink: {
    color: colors.accent,
    fontWeight: '600',
  },
});
