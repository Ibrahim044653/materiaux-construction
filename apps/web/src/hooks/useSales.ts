import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface SaleFilters {
  storeId?: string | null;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface SaleResult {
  receiptNumber: string;
  totalAmount: string | number;
  id: string;
  [key: string]: unknown;
}

export function useSales(filters: SaleFilters = {}) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: async () => {
      const res = await api.get('/sales', {
        params: {
          ...(filters.storeId ? { storeId: filters.storeId } : {}),
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          ...(filters.startDate ? { startDate: filters.startDate } : {}),
          ...(filters.endDate ? { endDate: filters.endDate } : {}),
        },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number } };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const res = await api.get(`/sales/${id}`);
      return res.data.data as unknown;
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/sales', data);
      return res.data.data as SaleResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      qc.invalidateQueries({ queryKey: ['stock-entries'] });
    },
  });
}

export function useDownloadReceipt() {
  return useMutation({
    mutationFn: async (saleId: string) => {
      const res = await api.get(`/sales/${saleId}/receipt`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-${saleId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

export function useReturnSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/sales/${id}/return`, { reason });
      return res.data.data as unknown;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales'] }),
  });
}
