import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useDashboardKpis(storeId?: string | null) {
  return useQuery({
    queryKey: ['dashboard-kpis', storeId],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis', { params: storeId ? { storeId } : {} });
      return res.data.data as unknown;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSalesChart(
  period: 'week' | 'month' | 'year' = 'month',
  storeId?: string | null
) {
  return useQuery({
    queryKey: ['dashboard-sales-chart', period, storeId],
    queryFn: async () => {
      const res = await api.get('/dashboard/sales-chart', {
        params: { period, ...(storeId ? { storeId } : {}) },
      });
      return res.data.data as unknown[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopProducts(storeId?: string | null) {
  return useQuery({
    queryKey: ['dashboard-top-products', storeId],
    queryFn: async () => {
      const res = await api.get('/dashboard/top-products', { params: storeId ? { storeId } : {} });
      return res.data.data as unknown[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStockAlerts(storeId?: string | null) {
  return useQuery({
    queryKey: ['dashboard-alerts', storeId],
    queryFn: async () => {
      const res = await api.get('/dashboard/alerts', { params: storeId ? { storeId } : {} });
      return res.data.data as unknown[];
    },
    staleTime: 3 * 60 * 1000,
  });
}
