import { http } from '@/src/api/http';
import type { AuthResponse } from '@/src/types';

export interface Credentials {
  email: string;
  password: string;
}

export async function login(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function register(credentials: Credentials): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', credentials);
  return data;
}
