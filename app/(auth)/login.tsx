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
import { color, font, gutter, space, text as t } from '@/src/theme';

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
      setError('Fill in both email and password.');
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
      setError(e?.message ?? 'Something went wrong. Try again.');
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
            {isRegister ? 'Let\'s find everything charging your account.' : 'Welcome back.'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Most of it is hidden in four or five places.'
              : 'Log in to see what you committed to.'}
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
    backgroundColor: color.paper,
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
    color: color.indigo,
    marginBottom: space.lg,
  },
  title: {
    ...t.title,
    marginBottom: space.xs,
  },
  subtitle: {
    ...t.body,
    color: color.muted,
    marginBottom: space.xl,
  },
  form: {
    marginBottom: space.lg,
    gap: 0,
  },
  error: {
    ...t.caption,
    color: color.debit,
    marginBottom: space.md,
  },
  toggle: {
    alignItems: 'center',
  },
  toggleText: {
    ...t.caption,
  },
  toggleLink: {
    color: color.indigo,
    fontFamily: font.sansMed,
  },
});
