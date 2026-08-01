import axios from 'axios';
import { getToken } from '@/src/api/tokenStorage';

// Point this at the real backend once it exists — everything else (hooks, screens)
// stays the same.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.subtrack.example';

export const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

http.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
