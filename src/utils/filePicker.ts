/**
 * expo-document-picker ships native code, so it throws at import time on a dev
 * client that was built before the package was added. Importing it eagerly took
 * the whole upload route down with it, so it is resolved lazily and the failure
 * is reported as a value the screen can render.
 */

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export type PickResult =
  | { status: 'picked'; file: PickedFile }
  | { status: 'canceled' }
  | { status: 'unavailable' }
  | { status: 'error' };

const ACCEPTED_TYPES = ['application/pdf', 'text/csv', 'text/comma-separated-values'];

type DocumentPickerModule = typeof import('expo-document-picker');

let cached: DocumentPickerModule | null | undefined;

/** Returns null when the native module isn't present in the current binary. */
function loadPicker(): DocumentPickerModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-document-picker') as DocumentPickerModule;
  } catch {
    cached = null;
  }
  return cached;
}

export function isFilePickerAvailable(): boolean {
  return loadPicker() !== null;
}

export async function pickStatementFile(): Promise<PickResult> {
  const picker = loadPicker();
  if (!picker) return { status: 'unavailable' };

  try {
    const result = await picker.getDocumentAsync({
      type: ACCEPTED_TYPES,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { status: 'canceled' };

    const asset = result.assets[0];
    return {
      status: 'picked',
      file: {
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: asset.mimeType ?? 'application/pdf',
      },
    };
  } catch {
    // Covers a native module that resolves but isn't linked into this build.
    return { status: 'error' };
  }
}
