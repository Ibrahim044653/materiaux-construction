import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart2, Package, Wallet, Users, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import {
  useSalesReport,
  useStockReport,
  useTreasuryReport,
  useCustomersDebtReport,
  useExportReport,
} from '../../hooks/useReports';
import { formatCFA, formatNumber } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';
import { StoreSelector } from '../../components/ui/StoreSelector';

type Tab = 'ventes' | 'stock' | 'tresorerie' | 'dettes';

const COLORS = ['#2563EB', '#F97316', '#22C55E', '#EF4444', '#8B5CF6', '#06B6D4'];

const thisMonth = startOfMonth(new Date());
const lastMonth = startOfMonth(subMonths(new Date(), 1));

export default function RapportsPage() {
  const { selectedStoreId } = useAuthStore();
  const [tab, setTab] = useState<Tab>('ventes');
  const [startDate, setStartDate] = useState(format(thisMonth, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: salesReport, isLoading: salesLoading } = useSalesReport({
    storeId: selectedStoreId,
    startDate,
    endDate,
  });
  const { data: stockReport, isLoading: stockLoading } = useStockReport({
    storeId: selectedStoreId,
  });
  const { data: treasuryReport, isLoading: treasuryLoading } = useTreasuryReport({
    storeId: selectedStoreId,
    startDate,
    endDate,
  });
  const { data: debtReport, isLoading: debtLoading } = useCustomersDebtReport();
  const exportReport = useExportReport();

  const TABS = [
    { key: 'ventes' as Tab, label: 'Ventes', icon: BarChart2 },
    { key: 'stock' as Tab, label: 'Stock', icon: Package },
    { key: 'tresorerie' as Tab, label: 'Trésorerie', icon: Wallet },
    { key: 'dettes' as Tab, label: 'Dettes', icon: Users },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-900">Rapports</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              exportReport.mutate({
                type:
                  tab === 'dettes'
                    ? 'clients'
                    : tab === 'tresorerie'
                      ? 'ventes'
                      : (tab as 'ventes' | 'stock' | 'clients'),
                params: { storeId: selectedStoreId, startDate, endDate },
              })
            }
            disabled={exportReport.isPending}
            className="btn btn-secondary text-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            {exportReport.isPending ? 'Export…' : 'Exporter Excel'}
          </button>
          <StoreSelector />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${tab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Filtre dates (sauf stock) */}
      {tab !== 'stock' && tab !== 'dettes' && (
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Du</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-36 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Au</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-36 text-sm"
            />
          </div>
          <button
            onClick={() => {
              setStartDate(format(lastMonth, 'yyyy-MM-dd'));
              setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
            }}
            className="btn btn-secondary text-xs"
          >
            Mois précédent
          </button>
          <button
            onClick={() => {
              setStartDate(format(thisMonth, 'yyyy-MM-dd'));
              setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
            }}
            className="btn btn-secondary text-xs"
          >
            Ce mois
          </button>
        </div>
      )}

      {/* Contenu */}
      {tab === 'ventes' && <SalesReportTab data={salesReport} loading={salesLoading} />}
      {tab === 'stock' && <StockReportTab data={stockReport} loading={stockLoading} />}
      {tab === 'tresorerie' && (
        <TreasuryReportTab data={treasuryReport} loading={treasuryLoading} />
      )}
      {tab === 'dettes' && <DebtReportTab data={debtReport} loading={debtLoading} />}
    </div>
  );
}

function SalesReportTab({ data, loading }: { data: unknown; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  const d = data as
    | {
        totalRevenue: number;
        totalSales: number;
        averageSale: number;
        byPaymentMethod: { method: string; count: number; amount: number }[];
        byDay: { date: string; revenue: number; count: number }[];
      }
    | undefined;
  if (!d) return null;
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card">
          <p className="text-xl font-bold text-gray-900">{formatCFA(Number(d.totalRevenue))}</p>
          <p className="text-xs text-gray-500 mt-0.5">Chiffre d'affaires</p>
        </div>
        <div className="kpi-card">
          <p className="text-xl font-bold text-gray-900">{formatNumber(d.totalSales)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ventes</p>
        </div>
        <div className="kpi-card">
          <p className="text-xl font-bold text-gray-900">{formatCFA(Number(d.averageSale))}</p>
          <p className="text-xs text-gray-500 mt-0.5">Panier moyen</p>
        </div>
      </div>

      {/* Graphique par jour */}
      {d.byDay?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">CA par jour</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.byDay} margin={{ left: 0, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [formatCFA(v), 'CA']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Par mode de paiement */}
      {d.byPaymentMethod?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Par mode de paiement</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={d.byPaymentMethod}
                dataKey="amount"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {d.byPaymentMethod.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCFA(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StockReportTab({ data, loading }: { data: unknown; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  const d = data as
    | {
        totalProducts: number;
        totalValue: number;
        lowStockProducts: { name: string; quantity: number; minQty: number }[];
        slowMoving: { name: string; lastSaleDate?: string }[];
      }
    | undefined;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="kpi-card">
          <p className="text-2xl font-bold text-gray-900">{formatNumber(d.totalProducts)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Produits en stock</p>
        </div>
        <div className="kpi-card">
          <p className="text-xl font-bold text-gray-900">{formatCFA(Number(d.totalValue))}</p>
          <p className="text-xs text-gray-500 mt-0.5">Valeur totale</p>
        </div>
      </div>

      {d.lowStockProducts?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">
            Produits en alerte ({d.lowStockProducts.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {d.lowStockProducts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-warning-50 rounded-lg text-sm"
              >
                <span className="truncate text-gray-700">{p.name}</span>
                <span className="font-bold text-warning-600 ml-2">
                  {p.quantity} / {p.minQty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.slowMoving?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">
            Produits à rotation lente ({d.slowMoving.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {d.slowMoving.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <span className="truncate text-gray-700">{p.name}</span>
                <span className="text-xs text-gray-400">
                  {p.lastSaleDate ? `Dernière: ${p.lastSaleDate}` : 'Jamais vendu'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TreasuryReportTab({ data, loading }: { data: unknown; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  const d = data as
    | {
        totalReceipts: number;
        totalCosts: number;
        grossMargin: number;
        grossMarginPercent: number;
        creditCollected: number;
        byCashType: { method: string; amount: number }[];
      }
    | undefined;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="kpi-card">
          <p className="text-xl font-bold text-success-600">{formatCFA(Number(d.totalReceipts))}</p>
          <p className="text-xs text-gray-500 mt-0.5">Encaissements</p>
        </div>
        <div className="kpi-card">
          <p className="text-xl font-bold text-danger-600">{formatCFA(Number(d.totalCosts))}</p>
          <p className="text-xs text-gray-500 mt-0.5">Coût des achats</p>
        </div>
        <div className="kpi-card col-span-2">
          <p className="text-2xl font-bold text-gray-900">{formatCFA(Number(d.grossMargin))}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Marge brute · {d.grossMarginPercent?.toFixed(1)}%
          </p>
        </div>
      </div>

      {d.byCashType?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Répartition des encaissements</h3>
          <div className="space-y-2">
            {d.byCashType.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
              >
                <span className="text-gray-700">{item.method}</span>
                <span className="font-bold text-gray-900">{formatCFA(Number(item.amount))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DebtReportTab({ data, loading }: { data: unknown; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  const d = data as
    | {
        totalDebt: number;
        customers: { id: string; name: string; creditBalance: number; phone?: string }[];
      }
    | undefined;
  if (!d) return null;
  return (
    <div className="space-y-4">
      <div className="kpi-card">
        <p className="text-2xl font-bold text-danger-600">{formatCFA(Number(d.totalDebt))}</p>
        <p className="text-xs text-gray-500 mt-0.5">Total des dettes clients</p>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">
          Clients débiteurs ({d.customers?.length ?? 0})
        </h3>
        {d.customers?.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune dette en cours</p>
        ) : (
          <div className="space-y-2">
            {d.customers?.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 bg-danger-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone ?? 'Pas de téléphone'}</p>
                </div>
                <p className="font-bold text-danger-600">{formatCFA(Number(c.creditBalance))}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
