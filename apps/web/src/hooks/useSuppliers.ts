import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useSuppliers(search?: string, page = 1) {
  return useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: async () => {
      const res = await api.get('/suppliers', {
        params: { ...(search ? { q: search } : {}), page, limit: 20 },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const res = await api.get(`/suppliers/${id}`);
      return res.data.data as unknown;
    },
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/suppliers', data);
      return res.data.data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await api.patch(`/suppliers/${id}`, data);
      return res.data.data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function usePurchaseOrders(supplierId?: string, page = 1) {
  return useQuery({
    queryKey: ['purchase-orders', supplierId, page],
    queryFn: async () => {
      const res = await api.get('/suppliers/orders', {
        params: { ...(supplierId ? { supplierId } : {}), page, limit: 20 },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/suppliers/orders', data);
      return res.data.data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  });
}

export function useReceiveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items }: { id: string; items: unknown[] }) => {
      const res = await api.patch(`/suppliers/orders/${id}/receive`, { items });
      return res.data.data as unknown;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['stock-entries'] });
    },
  });
}
