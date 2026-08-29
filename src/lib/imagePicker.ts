/**
 * expo-image-picker ships native code, so requiring it throws on a dev-client
 * binary built before the package was added — same situation as
 * react-native-purchases (see src/lib/purchases.ts), same fix: load lazily,
 * behind a try/catch, so a stale binary degrades to a message on the specific
 * action that needs it instead of crashing Metro's whole module graph on
 * import (which is what happens if this is imported eagerly at module scope).
 */
type ImagePickerNamespace = typeof import('expo-image-picker');

let cached: ImagePickerNamespace | null | undefined;

function load(): ImagePickerNamespace | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-image-picker') as ImagePickerNamespace;
  } catch {
    cached = null;
  }
  return cached;
}

export function isImagePickerAvailable(): boolean {
  return load() !== null;
}

export type PickedImage = {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

export type PickImageOutcome =
  | { status: 'picked'; image: PickedImage }
  | { status: 'cancelled' }
  | { status: 'unsupported-type' }
  | { status: 'permission-denied' }
  /** Native module missing from this binary (old dev client or Expo Go). */
  | { status: 'unavailable' };

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function pickImage(): Promise<PickImageOutcome> {
  const mod = load();
  if (!mod) return { status: 'unavailable' };

  const permission = await mod.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'permission-denied' };

  const result = await mod.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled) return { status: 'cancelled' };

  const asset = result.assets[0];
  const mimeType = asset.mimeType;
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) return { status: 'unsupported-type' };

  return { status: 'picked', image: { uri: asset.uri, mimeType: mimeType as PickedImage['mimeType'] } };
}
