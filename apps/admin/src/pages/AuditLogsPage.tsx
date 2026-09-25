import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Search, Filter } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import { formatDateTime } from '../lib/utils';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  tenant?: { id: string; name: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'badge-success',
  UPDATE: 'badge-warning',
  DELETE: 'badge-danger',
  LOGIN: 'bg-blue-900 text-blue-300',
  LOGOUT: 'bg-gray-700 text-gray-300',
  EXPORT: 'bg-purple-900 text-purple-300',
};

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'];
const RESOURCES = ['User', 'Tenant', 'Product', 'Sale', 'Stock', 'Customer', 'Supplier'];

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{
    data: AuditLog[];
    meta: { total: number; page: number; totalPages: number; perPage: number };
  }>({
    queryKey: ['admin', 'audit-logs', search, action, resource, page],
    queryFn: async () => {
      const res = await api.get('/audit-logs', {
        params: {
          search,
          action: action || undefined,
          resource: resource || undefined,
          page,
          perPage: 25,
        },
      });
      return res.data as {
        data: AuditLog[];
        meta: { total: number; page: number; totalPages: number; perPage: number };
      };
    },
    placeholderData: (prev) => prev,
  });

  const logs = (data?.data ?? []) as AuditLog[];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-gray-400 text-sm mt-1">{meta?.total ?? 0} événements enregistrés</p>
      </div>

      {error && (
        <div className="p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
          {getApiError(error)}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="input pl-8 appearance-none"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toutes actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="input pl-8 appearance-none"
            value={resource}
            onChange={(e) => {
              setResource(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Toutes ressources</option>
            {RESOURCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {isLoading &&
          [...Array(8)].map((_, i) => (
            <div key={i} className="admin-card animate-pulse h-16 bg-admin-700" />
          ))}
        {!isLoading && logs.length === 0 && (
          <div className="admin-card text-center py-12">
            <ScrollText size={40} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500">Aucun événement trouvé</p>
          </div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="admin-card cursor-pointer hover:border-admin-600 transition-colors"
            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`badge text-xs ${ACTION_COLORS[log.action] ?? 'bg-gray-700 text-gray-300'}`}
                  >
                    {log.action}
                  </span>
                  <span className="text-white text-sm font-medium">{log.resource}</span>
                  {log.resourceId && (
                    <span className="text-gray-500 text-xs font-mono truncate max-w-24">
                      {log.resourceId.slice(0, 8)}…
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {log.user && (
                    <span>
                      {log.user.name} ({log.user.email})
                    </span>
                  )}
                  {log.tenant && <span className="text-gray-500">· {log.tenant.name}</span>}
                  {log.ip && <span className="text-gray-600">· {log.ip}</span>}
                </div>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
                {formatDateTime(log.createdAt)}
              </span>
            </div>

            {/* Expanded details */}
            {expandedId === log.id && log.details && (
              <div className="mt-3 pt-3 border-t border-admin-700">
                <p className="text-xs text-gray-400 mb-1">Détails</p>
                <pre className="text-xs text-gray-300 bg-admin-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Page {meta.page} / {meta.totalPages}
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
