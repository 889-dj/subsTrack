import { http } from '@/src/api/http';
import type { User } from '@/src/types';

export interface MeResponse extends User {
  avatarUrl: string | null;
  isPro: boolean;
  proUntil: string | null;
  createdAt: string;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/me');
  return data;
}

interface LocalImage {
  /** file:// URI from an image picker, camera, or similar. */
  uri: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

/** Uploads a local image as the signed-in user's profile photo (max 5 MB). */
export async function uploadAvatar(image: LocalImage): Promise<{ avatarUrl: string }> {
  const extension = image.mimeType.split('/')[1];
  const form = new FormData();
  // React Native's FormData accepts this {uri, name, type} shape in place of
  // a Blob — see https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/.
  form.append('file', {
    uri: image.uri,
    name: `avatar.${extension}`,
    type: image.mimeType,
  } as unknown as Blob);

  const { data } = await http.post<{ avatarUrl: string }>('/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteAvatar(): Promise<void> {
  await http.delete('/me/avatar');
}
