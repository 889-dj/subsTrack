import axios from 'axios';
import { getToken } from '@/src/api/tokenStorage';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (USE_MOCK ? 'https://mock.substrack.local/v1' : '');

if (!API_URL) {
  throw new Error('Add EXPO_PUBLIC_API_URL (including /v1) when mock API mode is disabled.');
}

type TokenProvider = () => Promise<string | null>;
let tokenProvider: TokenProvider = getToken;

/** Clerk supplies rotating session JWTs; the mock keeps using SecureStore. */
export function setAuthTokenProvider(provider?: TokenProvider): void {
  tokenProvider = provider ?? getToken;
}

export const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

http.interceptors.request.use(async (config) => {
  const token = await tokenProvider();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
