import { useState } from 'react';
import { Plus, Truck, FileText, PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useSuppliers,
  useCreateSupplier,
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useReceiveOrder,
} from '../../hooks/useSuppliers';
import { formatCFA, formatDate } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/Badge';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../stores/authStore';

type Tab = 'suppliers' | 'orders';

const supplierSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  contactName: z.string().optional(),
});
type SupplierForm = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  contactName?: string;
}

export default function FournisseursPage() {
  const { selectedStoreId } = useAuthStore();
  const [tab, setTab] = useState<Tab>('suppliers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<OrderItem | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers(debouncedSearch, page);
  const { data: ordersData, isLoading: ordersLoading } = usePurchaseOrders(undefined, page);

  const createSupplier = useCreateSupplier();

  const suppliers = (suppliersData?.data ?? []) as Supplier[];
  const orders = (ordersData?.data ?? []) as OrderItem[];
  const suppliersMeta = suppliersData?.meta;
  const ordersMeta = ordersData?.meta;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
  });

  const onSubmit = async (values: SupplierForm) => {
    await createSupplier.mutateAsync(values);
    reset();
    setFormOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Fournisseurs</h1>
        <div className="flex gap-2">
          {tab === 'suppliers' && (
            <button
              onClick={() => setFormOpen(true)}
              className="btn btn-primary flex items-center gap-1 text-sm"
            >
              <Plus size={16} /> Nouveau
            </button>
          )}
          {tab === 'orders' && (
            <button
              onClick={() => setOrderOpen(true)}
              className="btn btn-primary flex items-center gap-1 text-sm"
            >
              <FileText size={16} /> Commande
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('suppliers')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'suppliers' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
        >
          Fournisseurs
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}
        >
          Bons de commande
        </button>
      </div>

      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Rechercher…"
      />

      {tab === 'suppliers' && (
        <>
          {suppliersLoading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Aucun fournisseur"
              description="Ajoutez vos fournisseurs."
              action={
                <button onClick={() => setFormOpen(true)} className="btn btn-primary">
                  Ajouter un fournisseur
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {suppliers.map((s) => (
                <div key={s.id} className="card flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Truck size={20} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">
                      {s.contactName ?? s.phone ?? 'Pas de contact'}
                    </p>
                  </div>
                </div>
              ))}
              {suppliersMeta && suppliersMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn btn-secondary"
                  >
                    ‹
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {suppliersMeta.totalPages}
                  </span>
                  <button
                    disabled={page === suppliersMeta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-secondary"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        <>
          {ordersLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune commande"
              description="Créez votre première commande fournisseur."
              action={
                <button onClick={() => setOrderOpen(true)} className="btn btn-primary">
                  Nouvelle commande
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="card p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{o.orderNumber}</p>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {o.supplier.name} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">{formatCFA(Number(o.totalAmount))}</p>
                  </div>
                  {o.status === 'SENT' && (
                    <button
                      onClick={() => setReceiveOrder(o)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success-50 text-success-600 text-sm font-medium hover:bg-success-100"
                    >
                      <PackageCheck size={15} />
                      Réceptionner la marchandise
                    </button>
                  )}
                </div>
              ))}
              {ordersMeta && ordersMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn btn-secondary"
                  >
                    ‹
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {ordersMeta.totalPages}
                  </span>
                  <button
                    disabled={page === ordersMeta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn btn-secondary"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Formulaire fournisseur */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nouveau fournisseur"
        size="md"
        footer={
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={createSupplier.isPending}
            className="btn btn-primary w-full"
          >
            {createSupplier.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        }
      >
        <form className="space-y-4">
          <Input label="Raison sociale *" error={errors.name?.message} {...register('name')} />
          <Input
            label="Nom du contact"
            error={errors.contactName?.message}
            {...register('contactName')}
          />
          <Input label="Téléphone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Adresse" error={errors.address?.message} {...register('address')} />
        </form>
      </Modal>

      {/* Formulaire commande */}
      <PurchaseOrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        suppliers={suppliers}
        storeId={selectedStoreId}
      />

      {/* Réception commande */}
      {receiveOrder && (
        <ReceiveOrderModal order={receiveOrder} onClose={() => setReceiveOrder(null)} />
      )}
    </div>
  );
}

type OrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  supplier: { name: string };
  items?: { productId: string; productName?: string; quantity: number; unitPrice: number }[];
};

function ReceiveOrderModal({ order, onClose }: { order: OrderItem; onClose: () => void }) {
  const receiveOrder = useReceiveOrder();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries((order.items ?? []).map((it) => [it.productId, it.quantity]))
  );

  const handleReceive = async () => {
    const items = (order.items ?? []).map((it) => ({
      productId: it.productId,
      quantity: quantities[it.productId] ?? it.quantity,
      unitPrice: it.unitPrice,
    }));
    await receiveOrder.mutateAsync({ id: order.id, items });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Réception — ${order.orderNumber}`}
      size="md"
      footer={
        <button
          onClick={handleReceive}
          disabled={receiveOrder.isPending}
          className="btn btn-primary w-full"
        >
          {receiveOrder.isPending ? 'Enregistrement…' : 'Confirmer la réception'}
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          Fournisseur : <span className="font-medium text-gray-900">{order.supplier.name}</span>
        </p>
        {(order.items ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucun article dans cette commande.
          </p>
        ) : (
          <div className="space-y-3">
            {(order.items ?? []).map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {item.productName ?? item.productId}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCFA(Number(item.unitPrice))} / unité
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantities((q) => ({
                        ...q,
                        [item.productId]: Math.max(0, (q[item.productId] ?? item.quantity) - 1),
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-medium"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">
                    {quantities[item.productId] ?? item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantities((q) => ({
                        ...q,
                        [item.productId]: (q[item.productId] ?? item.quantity) + 1,
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {receiveOrder.isError && (
          <p className="text-xs text-danger-600 text-center">
            {(receiveOrder.error as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Erreur lors de la réception'}
          </p>
        )}
      </div>
    </Modal>
  );
}

const orderSchema = z.object({
  supplierId: z.string().min(1, 'Fournisseur requis'),
  storeId: z.string().min(1, 'Magasin requis'),
  productId: z.string().min(1, 'Produit requis'),
  quantity: z.coerce.number().min(1),
  unitPrice: z.coerce.number().min(1),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

function PurchaseOrderModal({
  open,
  onClose,
  suppliers,
  storeId,
}: {
  open: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  storeId: string | null;
}) {
  const createOrder = useCreatePurchaseOrder();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormValues>({ resolver: zodResolver(orderSchema) });

  const onSubmit = async (values: OrderFormValues) => {
    await createOrder.mutateAsync({
      supplierId: values.supplierId,
      storeId: values.storeId,
      notes: values.notes,
      items: [
        { productId: values.productId, quantity: values.quantity, unitPrice: values.unitPrice },
      ],
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle commande fournisseur"
      size="md"
      footer={
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={createOrder.isPending}
          className="btn btn-primary w-full"
        >
          {createOrder.isPending ? 'Création…' : 'Créer la commande'}
        </button>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
          <select className="input" defaultValue="" {...register('supplierId')}>
            <option value="">Choisir un fournisseur…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.supplierId && (
            <p className="text-xs text-danger-600 mt-1">{errors.supplierId.message as string}</p>
          )}
        </div>
        <Input
          label="Magasin (ID)"
          defaultValue={storeId ?? ''}
          error={errors.storeId?.message as string}
          {...register('storeId')}
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
        <Input
          label="Prix unitaire (FCFA)"
          type="number"
          error={errors.unitPrice?.message as string}
          {...register('unitPrice')}
        />
        <Input label="Notes" {...register('notes')} />
      </form>
    </Modal>
  );
}
