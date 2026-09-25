import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useStockEntries(storeId?: string | null, page = 1) {
  return useQuery({
    queryKey: ['stock-entries', storeId, page],
    queryFn: async () => {
      const res = await api.get('/stock/entries', {
        params: { ...(storeId ? { storeId } : {}), page, limit: 20 },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useStockAlerts(storeId?: string | null) {
  return useQuery({
    queryKey: ['stock-alerts', storeId],
    queryFn: async () => {
      const res = await api.get('/stock/alerts', { params: storeId ? { storeId } : {} });
      return res.data.data as unknown[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useStockMovements(storeId?: string | null, page = 1) {
  return useQuery({
    queryKey: ['stock-movements', storeId, page],
    queryFn: async () => {
      const res = await api.get('/stock/movements', {
        params: { ...(storeId ? { storeId } : {}), page, limit: 30 },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useStockAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/stock/adjustment', data);
      return res.data.data as unknown;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entries'] });
      qc.invalidateQueries({ queryKey: ['stock-alerts'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
}

export function useTransfers(storeId?: string | null, page = 1) {
  return useQuery({
    queryKey: ['transfers', storeId, page],
    queryFn: async () => {
      const res = await api.get('/stock/transfers', {
        params: { ...(storeId ? { storeId } : {}), page, limit: 20 },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/stock/transfers', data);
      return res.data.data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}
