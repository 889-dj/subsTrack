import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/api/statements';
import type { ReviewedDetection, Statement } from '@/src/types';

const statementKey = (id: string) => ['statements', id] as const;
const detectionsKey = (id: string) => ['statements', id, 'detections'] as const;

export function useUploadStatement() {
  return useMutation({
    mutationFn: (file: api.StatementUpload) => api.uploadStatement(file),
  });
}

/**
 * Polls the statement while the backend is parsing/analyzing, and stops once it
 * reaches a terminal state.
 */
export function useStatement(id: string | undefined) {
  return useQuery({
    queryKey: statementKey(id ?? ''),
    queryFn: () => api.fetchStatement(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = (query.state.data as Statement | undefined)?.status;
      return status === 'ready' || status === 'failed' ? false : 800;
    },
  });
}

export function useDetections(statementId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: detectionsKey(statementId ?? ''),
    queryFn: () => api.fetchDetections(statementId!),
    enabled: !!statementId && enabled,
  });
}

export function useConfirmDetections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      statementId,
      detections,
    }: {
      statementId: string;
      detections: ReviewedDetection[];
    }) => api.confirmDetections(statementId, detections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
