import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type UserRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'ACCOUNTANT';

export interface TeamUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  storeId?: string | null;
  store?: { id: string; name: string } | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  password: string;
  storeId?: string;
}

export function useUsers(page = 1) {
  return useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const res = await api.get('/users', { params: { page, perPage: 50 } });
      return res.data as { data: TeamUser[]; meta: { total: number; totalPages: number } };
    },
    staleTime: 60 * 1000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['users'] });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const res = await api.post('/users', data);
      return res.data.data as TeamUser;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; phone?: string; role?: UserRole; storeId?: string | null };
    }) => {
      const res = await api.patch(`/users/${id}`, data);
      return res.data.data as TeamUser;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/users/${id}/toggle-active`);
      return res.data.data as TeamUser;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => invalidate(qc),
  });
}
