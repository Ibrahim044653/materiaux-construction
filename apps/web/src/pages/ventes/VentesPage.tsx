import { useState } from 'react';
import { Receipt, Download, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useSales, useDownloadReceipt } from '../../hooks/useSales';
import { useAuthStore } from '../../stores/authStore';
import { formatCFA, formatDate } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';

type SaleItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
};

type Sale = {
  id: string;
  receiptNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  globalDiscount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  cashier: { name: string };
  customer?: { name: string; phone: string } | null;
  store: { name: string };
  items: SaleItem[];
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  MTN_MONEY: 'MTN Money',
  VIREMENT: 'Virement',
  CREDIT: 'Crédit client',
};

export default function VentesPage() {
  const { selectedStoreId } = useAuthStore();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useSales({
    storeId: selectedStoreId,
    page,
    limit: 20,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const downloadReceipt = useDownloadReceipt();
  const sales = (data?.data ?? []) as Sale[];
  const meta = data?.meta;

  const filtered = statusFilter ? sales.filter((s) => s.status === statusFilter) : sales;

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('');
    setPage(1);
  };

  const hasFilters = startDate || endDate || statusFilter;

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Historique des ventes</h1>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger-600"
          >
            <X size={14} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="card p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="input text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="input text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="COMPLETED">Complété</option>
            <option value="PENDING_CREDIT">Crédit en cours</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune vente"
          description="Aucune vente ne correspond aux critères sélectionnés."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((sale) => {
            const isExpanded = expandedId === sale.id;
            return (
              <div key={sale.id} className="card overflow-hidden">
                {/* En-tête de la vente */}
                <div className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {sale.receiptNumber}
                      </span>
                      <StatusBadge status={sale.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(sale.createdAt)} · {sale.store?.name}
                      {sale.customer && ` · ${sale.customer.name}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod} ·{' '}
                      {sale.cashier?.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{formatCFA(Number(sale.totalAmount))}</p>
                    {Number(sale.amountDue) > 0 && (
                      <p className="text-xs text-danger-600">
                        Reste {formatCFA(Number(sale.amountDue))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? 'Masquer' : 'Détails'}
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => downloadReceipt.mutate(sale.id)}
                    disabled={downloadReceipt.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary-600 hover:bg-primary-50"
                  >
                    <Download size={14} />
                    Reçu PDF
                  </button>
                </div>

                {/* Détail des articles */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                    {sale.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-gray-800">{item.productName}</span>
                          <span className="text-gray-400 ml-2 text-xs">
                            {Number(item.quantity)} × {formatCFA(Number(item.unitPrice))}
                            {Number(item.discount) > 0 && ` − ${formatCFA(Number(item.discount))}`}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCFA(Number(item.total))}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-2 space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Sous-total</span>
                        <span>{formatCFA(Number(sale.subtotal))}</span>
                      </div>
                      {Number(sale.globalDiscount) > 0 && (
                        <div className="flex justify-between text-danger-600">
                          <span>Remise globale</span>
                          <span>− {formatCFA(Number(sale.globalDiscount))}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 text-sm">
                        <span>Total</span>
                        <span>{formatCFA(Number(sale.totalAmount))}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn btn-secondary"
              >
                ‹
              </button>
              <span className="text-sm text-gray-500">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-secondary"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
