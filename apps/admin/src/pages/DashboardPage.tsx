import { useQuery } from '@tanstack/react-query';
import { Building2, Users, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import { formatCFA, formatDate } from '../lib/utils';

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalSalesToday: string | number;
  recentTenants: Array<{
    id: string;
    name: string;
    plan: string;
    status: string;
    createdAt: string;
  }>;
  planBreakdown: Array<{ plan: string; count: number }>;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-600 text-gray-200',
  STARTER: 'bg-blue-800 text-blue-200',
  PRO: 'bg-primary-800 text-primary-200',
  ENTERPRISE: 'bg-purple-800 text-purple-200',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-danger',
  TRIAL: 'badge-warning',
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data as AdminStats;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="admin-card animate-pulse h-28 bg-admin-700" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400">
        Erreur : {getApiError(error)}
      </div>
    );
  }

  const stats = data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d'ensemble du système SaaS</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Tenants total</span>
            <div className="w-8 h-8 rounded-lg bg-primary-900/40 flex items-center justify-center">
              <Building2 size={16} className="text-primary-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalTenants}</p>
          <p className="text-xs text-success-400 mt-1">{stats.activeTenants} actifs</p>
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Utilisateurs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-900/40 flex items-center justify-center">
              <Users size={16} className="text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">Tous tenants</p>
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Ventes aujourd'hui</span>
            <div className="w-8 h-8 rounded-lg bg-success-900/40 flex items-center justify-center">
              <ShoppingCart size={16} className="text-success-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCFA(stats.totalSalesToday)}</p>
          <p className="text-xs text-gray-500 mt-1">Chiffre d'affaires</p>
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Taux activation</span>
            <div className="w-8 h-8 rounded-lg bg-orange-900/40 flex items-center justify-center">
              <TrendingUp size={16} className="text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalTenants > 0
              ? Math.round((stats.activeTenants / stats.totalTenants) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500 mt-1">Tenants actifs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tenants */}
        <div className="lg:col-span-2 admin-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-gray-400" />
            <h2 className="text-base font-semibold text-white">Derniers tenants inscrits</h2>
          </div>
          <div className="space-y-3">
            {stats.recentTenants?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Aucun tenant</p>
            )}
            {stats.recentTenants?.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-admin-700">
                <div className="w-9 h-9 rounded-lg bg-admin-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.name}</p>
                  <p className="text-gray-400 text-xs">{formatDate(t.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge ${STATUS_COLORS[t.status] ?? 'badge-warning'}`}>
                    {t.status}
                  </span>
                  <span
                    className={`badge text-xs px-2 py-0.5 rounded-md ${PLAN_COLORS[t.plan] ?? 'bg-gray-700 text-gray-300'}`}
                  >
                    {t.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan breakdown */}
        <div className="admin-card">
          <h2 className="text-base font-semibold text-white mb-4">Répartition par plan</h2>
          <div className="space-y-3">
            {stats.planBreakdown?.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">Aucune donnée</p>
            )}
            {stats.planBreakdown?.map(({ plan, count }) => {
              const pct =
                stats.totalTenants > 0 ? Math.round((count / stats.totalTenants) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`badge text-xs px-2 py-0.5 rounded-md ${PLAN_COLORS[plan] ?? 'bg-gray-700 text-gray-300'}`}
                    >
                      {plan}
                    </span>
                    <span className="text-white text-sm font-medium">{count}</span>
                  </div>
                  <div className="w-full bg-admin-700 rounded-full h-1.5">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
