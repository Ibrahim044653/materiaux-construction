import { useState } from 'react';
import { Plus, Users, Eye, CreditCard } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useCustomerSales,
  useCustomerPayments,
  useRecordPayment,
} from '../../hooks/useCustomers';
import { formatCFA, formatDate } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useDebounce } from '../../hooks/useDebounce';

const customerSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
});
type CustomerForm = z.infer<typeof customerSchema>;

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Montant requis'),
  method: z.string().min(1, 'Mode de paiement requis'),
  note: z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  creditBalance: number;
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useCustomers({ search: debouncedSearch, page });
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const customers = (data?.data ?? []) as Customer[];
  const meta = data?.meta;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const openCreate = () => {
    reset({});
    setEditCustomer(null);
    setFormOpen(true);
  };
  const openEdit = (c: Customer) => {
    reset(c);
    setEditCustomer(c);
    setFormOpen(true);
  };

  const onSubmit = async (values: CustomerForm) => {
    if (editCustomer) await updateCustomer.mutateAsync({ id: editCustomer.id, data: values });
    else await createCustomer.mutateAsync(values);
    setFormOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Clients</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Nom, téléphone…"
      />

      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client"
          description="Ajoutez vos premiers clients."
          action={
            <button onClick={openCreate} className="btn btn-primary">
              Ajouter un client
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm flex-shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone ?? 'Pas de téléphone'}</p>
              </div>
              {Number(c.creditBalance) > 0 && (
                <div className="text-right">
                  <Badge variant="danger">{formatCFA(Number(c.creditBalance))}</Badge>
                  <p className="text-xs text-gray-400 mt-0.5">dette</p>
                </div>
              )}
              <div className="flex gap-1">
                <button
                  onClick={() => setPaymentCustomerId(c.id)}
                  title="Enregistrer paiement"
                  className="tap-target w-9 h-9 rounded-lg text-success-600 hover:bg-success-50 flex items-center justify-center"
                >
                  <CreditCard size={16} />
                </button>
                <button
                  onClick={() => setDetailId(c.id)}
                  title="Voir détails"
                  className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}

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

      {/* Formulaire client */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editCustomer ? 'Modifier le client' : 'Nouveau client'}
        size="md"
        footer={
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={createCustomer.isPending || updateCustomer.isPending}
            className="btn btn-primary w-full"
          >
            {createCustomer.isPending || updateCustomer.isPending
              ? 'Enregistrement…'
              : 'Enregistrer'}
          </button>
        }
      >
        <form className="space-y-4">
          <Input label="Nom complet *" error={errors.name?.message} {...register('name')} />
          <Input label="Téléphone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Adresse" error={errors.address?.message} {...register('address')} />
        </form>
      </Modal>

      {/* Détail client */}
      {detailId && (
        <CustomerDetailModal
          customerId={detailId}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            const c = customers.find((x) => x.id === detailId);
            if (c) {
              setDetailId(null);
              openEdit(c);
            }
          }}
        />
      )}

      {/* Enregistrer paiement */}
      {paymentCustomerId && (
        <PaymentModal customerId={paymentCustomerId} onClose={() => setPaymentCustomerId(null)} />
      )}
    </div>
  );
}

function CustomerDetailModal({
  customerId,
  onClose,
  onEdit,
}: {
  customerId: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { data: sales, isLoading } = useCustomerSales(customerId);
  const { data: payments } = useCustomerPayments(customerId);

  type SaleItem = {
    id: string;
    receiptNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
  type PaymentItem = { id: string; amount: number; method: string; createdAt: string };
  const saleList = (sales?.data ?? []) as SaleItem[];
  const paymentList = (payments ?? []) as PaymentItem[];

  return (
    <Modal open={true} onClose={onClose} title="Historique client" size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn btn-secondary text-sm">
            Modifier
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Ventes ({saleList.length})</h3>
          {isLoading ? (
            <TableSkeleton rows={3} cols={3} />
          ) : saleList.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune vente</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {saleList.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-medium">{s.receiptNumber}</span>
                    <span className="text-gray-400 text-xs ml-2">{formatDate(s.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {s.status === 'COMPLETED' ? 'Soldée' : 'Crédit'}
                    </Badge>
                    <span className="font-bold">{formatCFA(Number(s.totalAmount))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Paiements reçus</h3>
          {paymentList.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun paiement</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {paymentList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 bg-success-50 rounded-lg text-sm"
                >
                  <span className="text-gray-600">
                    {p.method} · {formatDate(p.createdAt)}
                  </span>
                  <span className="font-bold text-success-600">+{formatCFA(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const recordPayment = useRecordPayment();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const METHODS = [
    { value: 'CASH', label: 'Espèces' },
    { value: 'ORANGE_MONEY', label: 'Orange Money' },
    { value: 'WAVE', label: 'Wave' },
    { value: 'MTN_MONEY', label: 'MTN Money' },
    { value: 'VIREMENT', label: 'Virement' },
  ];

  const onSubmit = async (values: PaymentForm) => {
    await recordPayment.mutateAsync({ id: customerId, data: values });
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Enregistrer un paiement"
      size="sm"
      footer={
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={recordPayment.isPending}
          className="btn btn-primary w-full"
        >
          {recordPayment.isPending ? 'Enregistrement…' : 'Valider le paiement'}
        </button>
      }
    >
      <form className="space-y-4">
        <Input
          label="Montant reçu (FCFA) *"
          type="number"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement *</label>
          <select className="input" {...register('method')}>
            <option value="">Choisir…</option>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {errors.method && <p className="mt-1 text-xs text-danger-600">{errors.method.message}</p>}
        </div>
        <Input label="Note" {...register('note')} />
      </form>
    </Modal>
  );
}
