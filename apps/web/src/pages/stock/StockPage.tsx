import { useState } from 'react';
import { Package, ArrowRightLeft, TrendingDown, AlertTriangle, Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import {
  useStockEntries,
  useStockAlerts,
  useStockMovements,
  useStockAdjustment,
  useTransfers,
  useCreateTransfer,
} from '../../hooks/useStock';
import { formatNumber, formatDate } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type Tab = 'entries' | 'movements' | 'alerts' | 'transfers';

export default function StockPage() {
  const { selectedStoreId } = useAuthStore();
  const [tab, setTab] = useState<Tab>('entries');
  const [page, setPage] = useState(1);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: entries, isLoading: entriesLoading } = useStockEntries(selectedStoreId, page);
  const { data: alerts, isLoading: alertsLoading } = useStockAlerts(selectedStoreId);
  const { data: movements, isLoading: movementsLoading } = useStockMovements(selectedStoreId, page);
  const { data: transfers, isLoading: transfersLoading } = useTransfers(selectedStoreId, page);

  const TABS: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'entries', label: 'Stocks', icon: Package },
    { key: 'movements', label: 'Mouvements', icon: TrendingDown },
    { key: 'alerts', label: 'Alertes', icon: AlertTriangle, badge: alerts?.length },
    { key: 'transfers', label: 'Transferts', icon: ArrowRightLeft },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Gestion du stock</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setAdjustOpen(true)}
            className="btn btn-secondary flex items-center gap-1 text-sm"
          >
            <Plus size={16} /> Ajustement
          </button>
          <button
            onClick={() => setTransferOpen(true)}
            className="btn btn-primary flex items-center gap-1 text-sm"
          >
            <ArrowRightLeft size={16} /> Transfert
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors relative ${
                tab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="ml-1 bg-warning-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenu par tab */}
      {tab === 'entries' && (
        <StockEntriesTab data={entries} loading={entriesLoading} page={page} setPage={setPage} />
      )}
      {tab === 'movements' && (
        <MovementsTab data={movements} loading={movementsLoading} page={page} setPage={setPage} />
      )}
      {tab === 'alerts' && <AlertsTab alerts={alerts} loading={alertsLoading} />}
      {tab === 'transfers' && (
        <TransfersTab data={transfers} loading={transfersLoading} page={page} setPage={setPage} />
      )}

      {/* Modal ajustement */}
      <AdjustmentModal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        storeId={selectedStoreId}
      />
      {/* Modal transfert */}
      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        storeId={selectedStoreId}
      />
    </div>
  );
}

function StockEntriesTab({
  data,
  loading,
  page,
  setPage,
}: {
  data: unknown;
  loading: boolean;
  page: number;
  setPage: (n: number) => void;
}) {
  const d = data as
    | {
        data: {
          productId: string;
          product: { name: string; reference: string; unit: string };
          quantity: number;
          reservedQty: number;
          store: { name: string };
        }[];
        meta: { totalPages: number };
      }
    | undefined;
  if (loading) return <TableSkeleton rows={8} cols={4} />;
  if (!d?.data?.length)
    return (
      <EmptyState
        icon={Package}
        title="Aucun stock enregistré"
        description="Les entrées de stock apparaîtront ici."
      />
    );
  return (
    <div className="space-y-2">
      {d.data.map((entry) => (
        <div key={entry.productId} className="card flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{entry.product.name}</p>
            <p className="text-xs text-gray-400">
              {entry.product.reference} · {entry.store.name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900">
              {formatNumber(entry.quantity)}{' '}
              <span className="text-xs text-gray-400">{entry.product.unit}</span>
            </p>
            {entry.reservedQty > 0 && (
              <p className="text-xs text-warning-500">Réservé: {entry.reservedQty}</p>
            )}
          </div>
        </div>
      ))}
      <Pagination page={page} totalPages={d.meta?.totalPages ?? 1} setPage={setPage} />
    </div>
  );
}

function MovementsTab({
  data,
  loading,
  page,
  setPage,
}: {
  data: unknown;
  loading: boolean;
  page: number;
  setPage: (n: number) => void;
}) {
  const d = data as
    | {
        data: {
          id: string;
          type: string;
          quantity: number;
          reason?: string;
          createdAt: string;
          product: { name: string };
          store: { name: string };
        }[];
        meta: { totalPages: number };
      }
    | undefined;
  const typeColors: Record<string, string> = {
    IN: 'success',
    OUT: 'danger',
    ADJUSTMENT: 'warning',
    TRANSFER_IN: 'primary',
    TRANSFER_OUT: 'gray',
  };
  const typeLabels: Record<string, string> = {
    IN: 'Entrée',
    OUT: 'Sortie',
    ADJUSTMENT: 'Ajustement',
    TRANSFER_IN: 'Transfert +',
    TRANSFER_OUT: 'Transfert -',
  };
  if (loading) return <TableSkeleton rows={8} cols={4} />;
  if (!d?.data?.length)
    return (
      <EmptyState
        icon={TrendingDown}
        title="Aucun mouvement"
        description="L'historique des mouvements apparaîtra ici."
      />
    );
  return (
    <div className="space-y-2">
      {d.data.map((m) => (
        <div key={m.id} className="card flex items-center gap-3 p-3">
          <Badge
            variant={
              (typeColors[m.type] as 'success' | 'danger' | 'warning' | 'primary' | 'gray') ??
              'gray'
            }
          >
            {typeLabels[m.type] ?? m.type}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{m.product.name}</p>
            <p className="text-xs text-gray-400">
              {m.reason ?? '-'} · {m.store.name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">
              {m.type.includes('OUT') ? '-' : '+'}
              {formatNumber(m.quantity)}
            </p>
            <p className="text-xs text-gray-400">{formatDate(m.createdAt)}</p>
          </div>
        </div>
      ))}
      <Pagination page={page} totalPages={d.meta?.totalPages ?? 1} setPage={setPage} />
    </div>
  );
}

function AlertsTab({ alerts, loading }: { alerts: unknown; loading: boolean }) {
  const list = alerts as
    | {
        productId: string;
        productName: string;
        currentQty: number;
        minQty: number;
        storeName: string;
      }[]
    | undefined;
  if (loading) return <TableSkeleton rows={5} cols={3} />;
  if (!list?.length)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Aucune alerte"
        description="Tous les stocks sont à un niveau correct."
      />
    );
  return (
    <div className="space-y-2">
      {list.map((a) => (
        <div
          key={a.productId}
          className="card bg-warning-50 border border-warning-200 flex items-center gap-3 p-3"
        >
          <AlertTriangle size={20} className="text-warning-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{a.productName}</p>
            <p className="text-xs text-gray-500">{a.storeName}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-warning-600">{formatNumber(a.currentQty)}</p>
            <p className="text-xs text-gray-400">min: {formatNumber(a.minQty)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransfersTab({
  data,
  loading,
  page,
  setPage,
}: {
  data: unknown;
  loading: boolean;
  page: number;
  setPage: (n: number) => void;
}) {
  const d = data as
    | {
        data: {
          id: string;
          status: string;
          createdAt: string;
          fromStore: { name: string };
          toStore: { name: string };
          items: { quantity: number }[];
        }[];
        meta: { totalPages: number };
      }
    | undefined;
  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (!d?.data?.length)
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="Aucun transfert"
        description="Les transferts inter-magasins apparaîtront ici."
      />
    );
  return (
    <div className="space-y-2">
      {d.data.map((t) => (
        <div key={t.id} className="card flex items-center gap-3 p-3">
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {t.fromStore.name} → {t.toStore.name}
            </p>
            <p className="text-xs text-gray-400">
              {formatDate(t.createdAt)} · {t.items.length} article{t.items.length > 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'}>
            {t.status === 'COMPLETED' ? 'Effectué' : 'En attente'}
          </Badge>
        </div>
      ))}
      <Pagination page={page} totalPages={d.meta?.totalPages ?? 1} setPage={setPage} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (n: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary">
        ‹
      </button>
      <span className="text-sm text-gray-500">
        {page} / {totalPages}
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
        className="btn btn-secondary"
      >
        ›
      </button>
    </div>
  );
}

const adjustFormSchema = z.object({
  productId: z.string().min(1, 'Produit requis'),
  newQuantity: z.coerce.number().min(0, 'Quantité ≥ 0'),
  reason: z.string().min(3, 'Motif requis'),
});
type AdjustFormValues = z.infer<typeof adjustFormSchema>;

function AdjustmentModal({
  open,
  onClose,
  storeId,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
}) {
  const adjust = useStockAdjustment();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustFormValues>({ resolver: zodResolver(adjustFormSchema) });

  const onSubmit = async (values: AdjustFormValues) => {
    await adjust.mutateAsync({ ...values, storeId });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustement de stock"
      size="sm"
      footer={
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={adjust.isPending}
          className="btn btn-primary w-full"
        >
          {adjust.isPending ? 'En cours…' : "Valider l'ajustement"}
        </button>
      }
    >
      <form className="space-y-4">
        <Input
          label="ID Produit *"
          error={errors.productId?.message as string}
          {...register('productId')}
        />
        <Input
          label="Nouvelle quantité *"
          type="number"
          error={errors.newQuantity?.message as string}
          {...register('newQuantity')}
        />
        <Input label="Motif *" error={errors.reason?.message as string} {...register('reason')} />
      </form>
    </Modal>
  );
}

const transferSchema = z.object({
  fromStoreId: z.string().min(1),
  toStoreId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().min(1),
});
type TransferFormValues = z.infer<typeof transferSchema>;

function TransferModal({
  open,
  onClose,
  storeId,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
}) {
  const transfer = useCreateTransfer();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues>({ resolver: zodResolver(transferSchema) });

  const onSubmit = async (values: TransferFormValues) => {
    await transfer.mutateAsync({
      ...values,
      items: [{ productId: values.productId, quantity: values.quantity }],
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfert inter-magasin"
      size="sm"
      footer={
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={transfer.isPending}
          className="btn btn-primary w-full"
        >
          {transfer.isPending ? 'En cours…' : 'Créer le transfert'}
        </button>
      }
    >
      <form className="space-y-4">
        <Input
          label="Magasin source (ID)"
          error={errors.fromStoreId?.message as string}
          defaultValue={storeId ?? ''}
          {...register('fromStoreId')}
        />
        <Input
          label="Magasin destination (ID)"
          error={errors.toStoreId?.message as string}
          {...register('toStoreId')}
        />
        <Input
          label="Produit (ID)"
          error={errors.productId?.message as string}
          {...register('productId')}
        />
        <Input
          label="Quantité"
          type="number"
          error={errors.quantity?.message as string}
          {...register('quantity')}
        />
      </form>
    </Modal>
  );
}
