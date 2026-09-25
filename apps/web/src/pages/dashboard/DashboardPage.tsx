import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, AlertTriangle, Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  useDashboardKpis,
  useSalesChart,
  useTopProducts,
  useStockAlerts,
} from '../../hooks/useDashboard';
import { formatCFA, formatNumber } from '../../lib/utils';
import { KpiSkeleton, Skeleton } from '../../components/ui/Skeleton';
import { StoreSelector } from '../../components/ui/StoreSelector';
import { Badge } from '../../components/ui/Badge';

type Period = 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: '7 jours',
  month: '30 jours',
  year: '12 mois',
};

interface KpiData {
  todayRevenue: number;
  todaySalesCount: number;
  pendingSalesCount: number;
  pendingCreditAmount: number;
  activeCustomers: number;
  totalDebt: number;
  stockAlertCount: number;
}

interface AlertItem {
  productId: string;
  productName: string;
  currentQty: number;
  minQty: number;
  storeName: string;
}

export default function DashboardPage() {
  const { selectedStoreId } = useAuthStore();
  const [period, setPeriod] = useState<Period>('month');

  const { data: kpisRaw, isLoading: kpisLoading } = useDashboardKpis(selectedStoreId);
  const { data: chartData, isLoading: chartLoading } = useSalesChart(period, selectedStoreId);
  const { data: topProductsRaw, isLoading: topLoading } = useTopProducts(selectedStoreId);
  const { data: alertsRaw, isLoading: alertsLoading } = useStockAlerts(selectedStoreId);

  const kpis = kpisRaw as KpiData | undefined;
  const topProducts = topProductsRaw as { name: string; revenue: number }[] | undefined;
  const alerts = alertsRaw as AlertItem[] | undefined;

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Vue d'ensemble de votre activité</p>
        </div>
        <StoreSelector />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="CA du jour"
              value={formatCFA(kpis?.todayRevenue ?? 0)}
              sub={`${formatNumber(kpis?.todaySalesCount ?? 0)} ventes`}
              icon={TrendingUp}
              color="primary"
            />
            <KpiCard
              label="Ventes en cours"
              value={formatNumber(kpis?.pendingSalesCount ?? 0)}
              sub={formatCFA(kpis?.pendingCreditAmount ?? 0)}
              icon={ShoppingCart}
              color="warning"
            />
            <KpiCard
              label="Clients actifs"
              value={formatNumber(kpis?.activeCustomers ?? 0)}
              sub={`${formatCFA(kpis?.totalDebt ?? 0)} de dettes`}
              icon={Users}
              color="success"
            />
            <KpiCard
              label="Alertes stock"
              value={formatNumber(kpis?.stockAlertCount ?? 0)}
              sub="produits en rupture"
              icon={AlertTriangle}
              color="danger"
            />
          </>
        )}
      </div>

      {/* Graphique ventes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Évolution des ventes</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  period === p ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {chartLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatCFA(value), 'CA']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top produits */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Top produits vendus</h2>
          {topLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={(topProducts ?? []).slice(0, 5)}
                layout="vertical"
                margin={{ left: 0, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(v: number) => [formatCFA(v), 'CA']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alertes stock */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-warning-500" />
            <h2 className="font-semibold text-gray-900">Alertes stock</h2>
            {!alertsLoading && (alerts?.length ?? 0) > 0 && (
              <Badge variant="warning">{alerts?.length}</Badge>
            )}
          </div>
          {alertsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !alerts?.length ? (
            <div className="text-center py-8 text-gray-400">
              <Package size={32} className="mx-auto mb-2" />
              <p className="text-sm">Aucune alerte stock</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.map(
                (alert: {
                  productId: string;
                  productName: string;
                  currentQty: number;
                  minQty: number;
                  storeName: string;
                }) => (
                  <div
                    key={alert.productId}
                    className="flex items-center justify-between p-2 bg-warning-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                        {alert.productName}
                      </p>
                      <p className="text-xs text-gray-500">{alert.storeName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-warning-600">{alert.currentQty}</p>
                      <p className="text-xs text-gray-400">min: {alert.minQty}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: 'primary' | 'warning' | 'success' | 'danger';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning-50 text-warning-500',
    success: 'bg-success-50 text-success-600',
    danger: 'bg-danger-50 text-danger-600',
  };
  return (
    <div className="kpi-card">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${colors[color]}`}
      >
        <Icon size={20} />
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
