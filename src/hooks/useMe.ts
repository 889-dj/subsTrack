import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/api/me';
import type { MeResponse } from '@/src/api/me';

const meKey = ['me'] as const;

export function useMe() {
  return useQuery({ queryKey: meKey, queryFn: api.fetchMe });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.uploadAvatar,
    onSuccess: ({ avatarUrl }) => {
      queryClient.setQueryData<MeResponse>(meKey, (prev) =>
        prev ? { ...prev, avatarUrl } : prev,
      );
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAvatar,
    onSuccess: () => {
      queryClient.setQueryData<MeResponse>(meKey, (prev) =>
        prev ? { ...prev, avatarUrl: null } : prev,
      );
    },
  });
}
