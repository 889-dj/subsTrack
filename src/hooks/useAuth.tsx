import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/src/api/auth';
import { clearToken, getToken, setToken } from '@/src/api/tokenStorage';
import type { Credentials } from '@/src/api/auth';
import type { User } from '@/src/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const token = await getToken();
      // We don't persist the user profile separately; a stored token is enough
      // to consider the session valid until the API rejects it.
      if (token) setUser({ id: 'restored', email: '' });
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    setError(null);
    try {
      const { token, user } = await authApi.login(credentials);
      await setToken(token);
      setUser(user);
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Could not log in. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (credentials: Credentials) => {
    setError(null);
    try {
      const { token, user } = await authApi.register(credentials);
      await setToken(token);
      setUser(user);
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

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, error, login, register, logout }}
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
