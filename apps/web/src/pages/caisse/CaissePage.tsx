import { useState, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, Download } from 'lucide-react';
import { useProductSearch } from '../../hooks/useProducts';
import { useCreateSale, useDownloadReceipt } from '../../hooks/useSales';
import { useCustomers } from '../../hooks/useCustomers';
import { useAuthStore } from '../../stores/authStore';
import { formatCFA } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { useDebounce } from '../../hooks/useDebounce';

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  unit: string;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CREDIT', label: 'Crédit client' },
];

export default function CaissePage() {
  const { selectedStoreId } = useAuthStore();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNumber: string;
    totalAmount: number;
    id: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data: searchResults = [], isLoading: searching } = useProductSearch(
    debouncedSearch,
    selectedStoreId
  );

  const createSale = useCreateSale();
  const downloadReceipt = useDownloadReceipt();

  const addToCart = useCallback(
    (product: { id: string; name: string; sellingPrice: number; unit: string }) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            unitPrice: Number(product.sellingPrice),
            quantity: 1,
            discount: 0,
            unit: product.unit,
          },
        ];
      });
      setSearch('');
    },
    []
  );

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity * (1 - i.discount / 100), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-2rem)] pb-16 lg:pb-0">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} className="mb-2">
          {error}
        </Alert>
      )}

      {/* Recherche produit */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit par nom ou référence…"
          className="input pl-10"
          autoComplete="off"
        />
        {/* Dropdown résultats */}
        {search.length >= 2 && (
          <div className="absolute top-full left-0 right-0 z-30 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-56 overflow-y-auto">
            {searching ? (
              <div className="p-3 text-sm text-gray-500">Recherche…</div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Aucun produit trouvé</div>
            ) : (
              (
                searchResults as {
                  id: string;
                  name: string;
                  reference: string;
                  sellingPrice: number;
                  unit: string;
                }[]
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.reference} · {p.unit}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary-600">
                    {formatCFA(Number(p.sellingPrice))}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Panier */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Le panier est vide</p>
            <p className="text-xs">Recherchez un produit pour commencer</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="card flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">
                  {formatCFA(item.unitPrice)} / {item.unit}
                </p>
              </div>
              {/* Quantité */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.productId, -1)}
                  className="tap-target w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.productId, 1)}
                  className="tap-target w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 hover:bg-primary-200"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  {formatCFA(item.unitPrice * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-danger-400 hover:text-danger-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total + bouton paiement */}
      {cart.length > 0 && (
        <div className="pt-3 border-t border-gray-100 mt-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatCFA(total)}</span>
          </div>
          <button
            onClick={() => setPaymentOpen(true)}
            className="btn btn-primary w-full text-base py-3"
          >
            Encaisser
          </button>
        </div>
      )}

      {/* Modal paiement */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        cart={cart}
        storeId={selectedStoreId}
        onSuccess={(receipt) => {
          setLastReceipt(receipt);
          setCart([]);
          setPaymentOpen(false);
          setSuccessOpen(true);
          downloadReceipt.reset();
        }}
        onError={setError}
        createSale={createSale}
      />

      {/* Modal succès */}
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-16 h-16 bg-success-50 rounded-2xl flex items-center justify-center">
            <Check size={32} className="text-success-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Vente enregistrée !</h3>
          <p className="text-sm text-gray-500">Reçu n° {lastReceipt?.receiptNumber}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCFA(lastReceipt?.totalAmount ?? 0)}
          </p>
          <button
            onClick={() => lastReceipt?.id && downloadReceipt.mutate(lastReceipt.id)}
            disabled={downloadReceipt.isPending}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {downloadReceipt.isPending ? 'Téléchargement…' : 'Télécharger le reçu PDF'}
          </button>
          <button onClick={() => setSuccessOpen(false)} className="btn btn-primary w-full">
            Nouvelle vente
          </button>
        </div>
      </Modal>
    </div>
  );
}

function PaymentModal({
  open,
  onClose,
  total,
  cart,
  storeId,
  onSuccess,
  onError,
  createSale,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  cart: CartItem[];
  storeId: string | null;
  onSuccess: (r: { receiptNumber: string; totalAmount: number; id: string }) => void;
  onError: (msg: string) => void;
  createSale: ReturnType<typeof useCreateSale>;
}) {
  const [method, setMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const debouncedCs = useDebounce(customerSearch, 300);
  const { data: customers } = useCustomers({ search: debouncedCs });

  const amountPaidNum = amountPaid ? Number(amountPaid) : total;
  const amountDue = total - amountPaidNum;
  const change = amountPaidNum > total ? amountPaidNum - total : 0;

  const handleSubmit = async () => {
    if (!storeId) {
      onError('Sélectionnez un magasin');
      return;
    }
    try {
      const payload = {
        storeId,
        customerId: customerId || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
        })),
        paymentMethod: amountDue > 0 ? 'CREDIT' : method,
        amountPaid: amountPaidNum,
      };
      const sale = await createSale.mutateAsync(payload);
      onSuccess({
        receiptNumber: sale.receiptNumber,
        totalAmount: Number(sale.totalAmount),
        id: sale.id,
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erreur lors de la vente';
      onError(msg);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Encaissement"
      size="md"
      footer={
        <button
          onClick={handleSubmit}
          disabled={createSale.isPending}
          className="btn btn-primary w-full py-3 text-base"
        >
          {createSale.isPending ? 'Enregistrement…' : `Valider · ${formatCFA(total)}`}
        </button>
      }
    >
      <div className="space-y-4">
        {/* Résumé */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {cart.length} article{cart.length > 1 ? 's' : ''}
            </span>
            <span className="font-bold text-gray-900">{formatCFA(total)}</span>
          </div>
        </div>

        {/* Client (optionnel) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client (optionnel)</label>
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="input"
          />
          {customerSearch.length >= 2 && (customers?.data?.length ?? 0) > 0 && (
            <div className="border border-gray-200 rounded-xl mt-1 max-h-32 overflow-y-auto">
              {((customers?.data as { id: string; name: string; phone?: string }[]) ?? []).map(
                (c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearch(c.name);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                  >
                    {c.name} {c.phone ? `· ${c.phone}` : ''}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Montant reçu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant reçu (FCFA)
          </label>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder={String(total)}
            className="input text-lg font-bold"
            min={0}
          />
          {change > 0 && (
            <p className="mt-1 text-sm text-success-600 font-medium">
              Monnaie à rendre : {formatCFA(change)}
            </p>
          )}
          {amountDue > 0 && amountPaid && (
            <p className="mt-1 text-sm text-warning-600 font-medium">
              Reste dû : {formatCFA(amountDue)} → Crédit client
            </p>
          )}
        </div>

        {/* Mode de paiement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.filter((m) => m.value !== 'CREDIT').map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  method === m.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
