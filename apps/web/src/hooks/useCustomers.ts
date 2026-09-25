import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface CustomerFilters {
  search?: string;
  page?: number;
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const res = await api.get('/customers', {
        params: {
          ...(filters.search ? { q: filters.search } : {}),
          page: filters.page ?? 1,
          limit: 20,
        },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data.data as unknown;
    },
    enabled: !!id,
  });
}

export function useCustomerSales(id: string, page = 1) {
  return useQuery({
    queryKey: ['customer-sales', id, page],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}/sales`, { params: { page, limit: 10 } });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    enabled: !!id,
  });
}

export function useCustomerPayments(id: string) {
  return useQuery({
    queryKey: ['customer-payments', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}/payments`);
      return res.data.data as unknown[];
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/customers', data);
      return res.data.data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await api.patch(`/customers/${id}`, data);
      return res.data.data as unknown;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer', id] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await api.post(`/customers/${id}/payments`, data);
      return res.data.data as unknown;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['customer', id] });
      qc.invalidateQueries({ queryKey: ['customer-payments', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
