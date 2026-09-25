import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

interface ReportParams {
  storeId?: string | null;
  startDate: string;
  endDate: string;
}

export function useSalesReport(params: ReportParams) {
  return useQuery({
    queryKey: ['report-sales', params],
    queryFn: async () => {
      const { storeId, startDate, endDate } = params;
      const res = await api.get('/reports/sales', {
        params: { ...(storeId ? { storeId } : {}), startDate, endDate },
      });
      return res.data.data as unknown;
    },
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockReport(params: { storeId?: string | null }) {
  return useQuery({
    queryKey: ['report-stock', params],
    queryFn: async () => {
      const res = await api.get('/reports/stock', {
        params: params.storeId ? { storeId: params.storeId } : {},
      });
      return res.data.data as unknown;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTreasuryReport(params: ReportParams) {
  return useQuery({
    queryKey: ['report-treasury', params],
    queryFn: async () => {
      const { storeId, startDate, endDate } = params;
      const res = await api.get('/reports/treasury', {
        params: { ...(storeId ? { storeId } : {}), startDate, endDate },
      });
      return res.data.data as unknown;
    },
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomersDebtReport() {
  return useQuery({
    queryKey: ['report-customers-debt'],
    queryFn: async () => {
      const res = await api.get('/reports/customers-debt');
      return res.data.data as unknown;
    },
    staleTime: 5 * 60 * 1000,
  });
}

type ExportType = 'ventes' | 'stock' | 'clients';
interface ExportParams {
  storeId?: string | null;
  startDate?: string;
  endDate?: string;
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({ type, params }: { type: ExportType; params?: ExportParams }) => {
      const res = await api.get(`/reports/export/${type}`, {
        params: {
          ...(params?.storeId ? { storeId: params.storeId } : {}),
          ...(params?.startDate ? { startDate: params.startDate } : {}),
          ...(params?.endDate ? { endDate: params.endDate } : {}),
        },
        responseType: 'blob',
      });
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${type}-${date}.xlsx`;
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
