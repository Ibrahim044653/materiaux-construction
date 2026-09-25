import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MoreVertical, CheckCircle, XCircle, Trash2, Plus } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import { formatDate } from '../lib/utils';

interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  createdAt: string;
  _count?: { users: number; stores: number };
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  TRIAL: 'badge-warning',
};

const PLAN_BADGE: Record<string, string> = {
  FREE: 'bg-gray-700 text-gray-300',
  STARTER: 'bg-blue-900 text-blue-300',
  PRO: 'bg-primary-900 text-primary-300',
  ENTERPRISE: 'bg-purple-900 text-purple-300',
};

export default function TenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tenant | null>(null);
  const [actionError, setActionError] = useState('');

  const { data, isLoading } = useQuery<{ data: Tenant[]; meta: { total: number } }>({
    queryKey: ['admin', 'tenants', search],
    queryFn: async () => {
      const res = await api.get('/tenants', { params: { search, perPage: 50 } });
      return res.data as { data: Tenant[]; meta: { total: number } };
    },
    placeholderData: (prev) => prev,
  });

  const mutateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/tenants/${id}/status`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      setMenuId(null);
      setActionError('');
    },
    onError: (e) => {
      setActionError(getApiError(e));
    },
  });

  const mutateDelete = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/tenants/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      setConfirmDelete(null);
      setActionError('');
    },
    onError: (e) => {
      setActionError(getApiError(e));
    },
  });

  const tenants = (data?.data ?? []) as Tenant[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.meta?.total ?? 0} organisations</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nouveau tenant
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
          {actionError}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Rechercher un tenant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-700">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Organisation</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Utilisateurs</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Inscrit le</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-admin-700/50">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-4 bg-admin-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {!isLoading && tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Aucun tenant trouvé
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr
                key={t.id}
                className="border-b border-admin-700/50 hover:bg-admin-700/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-admin-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-gray-400 text-xs">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge text-xs px-2 py-0.5 rounded-md ${PLAN_BADGE[t.plan] ?? 'bg-gray-700 text-gray-300'}`}
                  >
                    {t.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[t.status] ?? 'badge-warning'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{t._count?.users ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3 relative">
                  <button
                    onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                    className="p-1.5 rounded-lg hover:bg-admin-600 text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuId === t.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                      <div className="absolute right-4 top-full mt-1 z-20 bg-admin-700 border border-admin-600 rounded-xl shadow-xl w-48 overflow-hidden">
                        {t.status !== 'ACTIVE' && (
                          <button
                            onClick={() => mutateStatus.mutate({ id: t.id, status: 'ACTIVE' })}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-success-400 hover:bg-admin-600 transition-colors"
                          >
                            <CheckCircle size={14} />
                            Activer
                          </button>
                        )}
                        {t.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => mutateStatus.mutate({ id: t.id, status: 'SUSPENDED' })}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-warning-400 hover:bg-admin-600 transition-colors"
                          >
                            <XCircle size={14} />
                            Suspendre
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setConfirmDelete(t);
                            setMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-danger-400 hover:bg-admin-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-admin-800 border border-admin-700 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-900/40 rounded-xl flex items-center justify-center">
                <Trash2 size={20} className="text-danger-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Supprimer le tenant</h3>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              Supprimer <strong className="text-white">{confirmDelete.name}</strong> ?
            </p>
            <p className="text-danger-400 text-xs mb-5">
              Cette action est irréversible. Toutes les données seront supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary flex-1">
                Annuler
              </button>
              <button
                onClick={() => mutateDelete.mutate(confirmDelete.id)}
                disabled={mutateDelete.isPending}
                className="btn bg-danger-700 hover:bg-danger-600 text-white flex-1"
              >
                {mutateDelete.isPending ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
