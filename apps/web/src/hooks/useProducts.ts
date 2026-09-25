import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface ProductFilters {
  storeId?: string | null;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          ...(filters.storeId ? { storeId: filters.storeId } : {}),
          ...(filters.search ? { q: filters.search } : {}),
          ...(filters.category ? { category: filters.category } : {}),
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
        },
      });
      return res.data as { data: unknown[]; meta: { totalPages: number; total: number } };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductSearch(q: string, storeId?: string | null) {
  return useQuery({
    queryKey: ['product-search', q, storeId],
    queryFn: async () => {
      const res = await api.get('/products/search', {
        params: { q, ...(storeId ? { storeId } : {}) },
      });
      return res.data.data as unknown[];
    },
    enabled: q.length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await api.post('/products', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const res = await api.patch(`/products/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
