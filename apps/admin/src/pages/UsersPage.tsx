import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Shield, UserCheck } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import { formatDate } from '../lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tenant?: { id: string; name: string };
}

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-900 text-purple-300',
  ADMIN: 'bg-primary-900 text-primary-300',
  MANAGER: 'bg-blue-900 text-blue-300',
  CASHIER: 'bg-gray-700 text-gray-300',
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  SUPER_ADMIN: <Shield size={12} />,
  ADMIN: <UserCheck size={12} />,
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<{
    data: User[];
    meta: { total: number; page: number; perPage: number; totalPages: number };
  }>({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const res = await api.get('/users', { params: { search, page, perPage: 20 } });
      return res.data as {
        data: User[];
        meta: { total: number; page: number; perPage: number; totalPages: number };
      };
    },
    placeholderData: (prev) => prev,
  });

  const users = (data?.data ?? []) as User[];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
        <p className="text-gray-400 text-sm mt-1">{meta?.total ?? 0} comptes au total</p>
      </div>

      {error && (
        <div className="p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
          {getApiError(error)}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="admin-card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-700">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Utilisateur</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Rôle</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Organisation</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-admin-700/50">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-4 bg-admin-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-admin-700/50 hover:bg-admin-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-gray-400 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge text-xs px-2 py-0.5 rounded-md flex items-center gap-1 w-fit ${ROLE_BADGE[u.role] ?? 'bg-gray-700 text-gray-300'}`}
                  >
                    {ROLE_ICON[u.role]}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.tenant ? (
                    <span className="text-gray-300 text-xs">{u.tenant.name}</span>
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Page {meta.page} sur {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="btn btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="btn btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
