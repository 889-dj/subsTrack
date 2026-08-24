import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ClerkProvider,
  useAuth as useClerkSession,
  useClerk,
  useSignIn,
  useSignUp,
  useUser,
} from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as authApi from '@/src/api/auth';
import { clearToken, getToken as getStoredToken, setToken } from '@/src/api/tokenStorage';
import { setAuthTokenProvider } from '@/src/api/http';
import type { Credentials } from '@/src/api/auth';
import type { User } from '@/src/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<AuthActionResult>;
  register: (credentials: Credentials) => Promise<AuthActionResult>;
  verificationPending: boolean;
  verificationEmail: string | null;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  cancelVerification: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export type AuthActionResult = 'authenticated' | 'verification_required';
type VerificationKind = 'signup' | 'signin';

const AuthContext = createContext<AuthContextValue | null>(null);

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      // We don't persist the user profile separately; a stored token is enough
      // to consider the session valid until the API rejects it.
      if (token) setUser({ id: 'restored', email: '' });
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (credentials: Credentials): Promise<AuthActionResult> => {
    setError(null);
    try {
      const { token, user } = await authApi.login(credentials);
      await setToken(token);
      setUser(user);
      return 'authenticated';
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Could not log in. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (credentials: Credentials): Promise<AuthActionResult> => {
    setError(null);
    try {
      const { token, user } = await authApi.register(credentials);
      await setToken(token);
      setUser(user);
      return 'authenticated';
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Could not create your account.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    await clearToken();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        verificationPending: false,
        verificationEmail: null,
        verifyEmail: async () => undefined,
        resendVerification: async () => undefined,
        cancelVerification: async () => undefined,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (USE_MOCK) return <MockAuthProvider>{children}</MockAuthProvider>;
  if (!CLERK_PUBLISHABLE_KEY) {
    return <UnconfiguredAuthProvider>{children}</UnconfiguredAuthProvider>;
  }
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkAuthProvider>{children}</ClerkAuthProvider>
    </ClerkProvider>
  );
}

function UnconfiguredAuthProvider({ children }: { children: React.ReactNode }) {
  const message = 'Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to use the production API.';
  const reject = async (): Promise<never> => {
    throw new Error(message);
  };
  return (
    <AuthContext.Provider
      value={{
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: message,
        login: reject,
        register: reject,
        verificationPending: false,
        verificationEmail: null,
        verifyEmail: reject,
        resendVerification: reject,
        cancelVerification: async () => undefined,
        logout: async () => undefined,
        deleteAccount: reject,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function clerkMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    if ('longMessage' in error && typeof error.longMessage === 'string') return error.longMessage;
    if ('message' in error && typeof error.message === 'string') return error.message;
  }
  return fallback;
}

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkSession({
    treatPendingAsSignedOut: false,
  });
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [verificationKind, setVerificationKind] = useState<VerificationKind | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    setAuthTokenProvider(() => getToken());
    return () => setAuthTokenProvider();
  }, [getToken]);

  const user = useMemo<User | null>(() => {
    if (!isSignedIn || !clerkUser) return null;
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
    };
  }, [clerkUser, isSignedIn]);

  const login = useCallback(
    async ({ email, password }: Credentials): Promise<AuthActionResult> => {
      setError(null);
      const result = await signIn.password({ identifier: email, password });
      if (result.error) {
        const message = clerkMessage(result.error, 'Could not log in. Please try again.');
        setError(message);
        throw new Error(message);
      }
      if (signIn.status === 'complete') {
        const finalized = await signIn.finalize();
        if (finalized.error) throw new Error(clerkMessage(finalized.error, 'Could not finish login.'));
        return 'authenticated';
      }
      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        const sent = await signIn.mfa.sendEmailCode();
        if (sent.error) throw new Error(clerkMessage(sent.error, 'Could not send the verification code.'));
        setVerificationKind('signin');
        setVerificationEmail(email);
        return 'verification_required';
      }
      throw new Error('This account requires an authentication step the app does not support yet.');
    },
    [signIn],
  );

  const register = useCallback(
    async ({ email, password }: Credentials): Promise<AuthActionResult> => {
      setError(null);
      const result = await signUp.password({ emailAddress: email, password });
      if (result.error) {
        const message = clerkMessage(result.error, 'Could not create your account.');
        setError(message);
        throw new Error(message);
      }
      if (signUp.status === 'complete') {
        const finalized = await signUp.finalize();
        if (finalized.error) throw new Error(clerkMessage(finalized.error, 'Could not finish sign up.'));
        return 'authenticated';
      }
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) throw new Error(clerkMessage(sent.error, 'Could not send the verification code.'));
      setVerificationKind('signup');
      setVerificationEmail(email);
      return 'verification_required';
    },
    [signUp],
  );

  const verifyEmail = useCallback(
    async (code: string) => {
      setError(null);
      if (verificationKind === 'signup') {
        const result = await signUp.verifications.verifyEmailCode({ code });
        if (result.error) throw new Error(clerkMessage(result.error, 'That code is not valid.'));
        if (signUp.status !== 'complete') throw new Error('Email verification is not complete.');
        const finalized = await signUp.finalize();
        if (finalized.error) throw new Error(clerkMessage(finalized.error, 'Could not finish sign up.'));
      } else if (verificationKind === 'signin') {
        const result = await signIn.mfa.verifyEmailCode({ code });
        if (result.error) throw new Error(clerkMessage(result.error, 'That code is not valid.'));
        if (signIn.status !== 'complete') throw new Error('Sign-in verification is not complete.');
        const finalized = await signIn.finalize();
        if (finalized.error) throw new Error(clerkMessage(finalized.error, 'Could not finish login.'));
      } else {
        throw new Error('There is no verification in progress.');
      }
      setVerificationKind(null);
      setVerificationEmail(null);
    },
    [signIn, signUp, verificationKind],
  );

  const resendVerification = useCallback(async () => {
    const result = verificationKind === 'signup'
      ? await signUp.verifications.sendEmailCode()
      : verificationKind === 'signin'
        ? await signIn.mfa.sendEmailCode()
        : null;
    if (!result) throw new Error('There is no verification in progress.');
    if (result.error) throw new Error(clerkMessage(result.error, 'Could not resend the code.'));
  }, [signIn, signUp, verificationKind]);

  const cancelVerification = useCallback(async () => {
    if (verificationKind === 'signup') await signUp.reset();
    if (verificationKind === 'signin') await signIn.reset();
    setVerificationKind(null);
    setVerificationEmail(null);
    setError(null);
  }, [signIn, signUp, verificationKind]);

  const logout = useCallback(async () => {
    await signOut();
    queryClient.clear();
  }, [queryClient, signOut]);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    queryClient.clear();
    try {
      await signOut();
    } catch {
      // The backend may already have deleted the Clerk identity.
    }
  }, [queryClient, signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded || !isUserLoaded,
        isAuthenticated: Boolean(isSignedIn),
        error,
        login,
        register,
        verificationPending: verificationKind !== null,
        verificationEmail,
        verifyEmail,
        resendVerification,
        cancelVerification,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
