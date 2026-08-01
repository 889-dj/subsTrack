import { http } from '@/src/api/http';
import type {
  ConfirmDetectionsResponse,
  DetectedSubscription,
  ReviewedDetection,
  Statement,
} from '@/src/types';

export interface StatementUpload {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Uploads the picked file as multipart/form-data. The backend responds as soon
 * as the file lands — parsing and AI analysis happen async, polled via
 * fetchStatement.
 */
export async function uploadStatement(file: StatementUpload): Promise<Statement> {
  const form = new FormData();
  // React Native's FormData takes this {uri, name, type} shape for files.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const { data } = await http.post<Statement>('/statements', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchStatement(id: string): Promise<Statement> {
  const { data } = await http.get<Statement>(`/statements/${id}`);
  return data;
}

export async function fetchDetections(statementId: string): Promise<DetectedSubscription[]> {
  const { data } = await http.get<DetectedSubscription[]>(
    `/statements/${statementId}/detections`
  );
  return data;
}

/** Turns the detections the user kept into real Subscription records. */
export async function confirmDetections(
  statementId: string,
  detections: ReviewedDetection[]
): Promise<ConfirmDetectionsResponse> {
  const { data } = await http.post<ConfirmDetectionsResponse>(
    `/statements/${statementId}/confirm`,
    { detections }
  );
  return data;
}
