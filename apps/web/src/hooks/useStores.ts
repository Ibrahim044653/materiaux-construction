import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Store {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { users: number };
}

export interface StoreInput {
  name: string;
  address?: string;
  phone?: string;
}

export function useStores() {
  return useQuery({
    queryKey: ['stores-list'],
    queryFn: async () => {
      const res = await api.get('/stores');
      return res.data.data as Store[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['stores-list'] });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: StoreInput) => {
      const res = await api.post('/stores', data);
      return res.data.data as Store;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StoreInput> & { isActive?: boolean };
    }) => {
      const res = await api.patch(`/stores/${id}`, data);
      return res.data.data as Store;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stores/${id}`);
    },
    onSuccess: () => invalidate(qc),
  });
}
