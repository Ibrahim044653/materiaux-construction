import { useState } from 'react';
import { Plus, Package, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/authStore';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { formatCFA } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useDebounce } from '../../hooks/useDebounce';

const CATEGORIES = [
  { value: 'CIMENT', label: 'Ciment' },
  { value: 'FER', label: 'Fer et métal' },
  { value: 'BOIS', label: 'Bois' },
  { value: 'PEINTURE', label: 'Peinture' },
  { value: 'PLOMBERIE', label: 'Plomberie' },
  { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'CARRELAGE', label: 'Carrelage' },
  { value: 'TOITURE', label: 'Toiture' },
  { value: 'OUTILLAGE', label: 'Outillage' },
  { value: 'AUTRE', label: 'Autre' },
];

const productSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  reference: z.string().min(1, 'Référence requise'),
  category: z.string().min(1, 'Catégorie requise'),
  unit: z.string().min(1, 'Unité requise'),
  sellingPrice: z.coerce.number().min(1, 'Prix requis'),
  costPrice: z.coerce.number().min(0),
  minStockLevel: z.coerce.number().min(0),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  reference: string;
  category: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  minStockLevel: number;
  description?: string;
}

export default function ProduitsPage() {
  const { selectedStoreId } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProducts({
    storeId: selectedStoreId,
    search: debouncedSearch,
    category,
    page,
  });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = (data?.data ?? []) as Product[];
  const meta = data?.meta;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({ resolver: zodResolver(productSchema) });

  const openCreate = () => {
    reset({});
    setEditProduct(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    reset(p);
    setEditProduct(p);
    setFormOpen(true);
  };

  const onSubmit = async (values: ProductForm) => {
    if (editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, data: values });
    } else {
      await createProduct.mutateAsync({ ...values, storeId: selectedStoreId });
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Catalogue produits</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <SearchBar
          value={search}
          onChange={setSearch}
          className="flex-1"
          placeholder="Nom, référence…"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="input w-36"
        >
          <option value="">Toutes</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit"
          description="Ajoutez votre premier produit au catalogue."
          action={
            <button onClick={openCreate} className="btn btn-primary">
              Ajouter un produit
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {/* Desktop table header */}
          <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span className="col-span-2">Produit</span>
            <span>Catégorie</span>
            <span className="text-right">Prix vente</span>
            <span className="text-right">Actions</span>
          </div>
          {products.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {p.reference} · {p.unit}
                </p>
              </div>
              <div className="hidden sm:block">
                <Badge variant="primary">
                  {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                </Badge>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCFA(Number(p.sellingPrice))}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

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

      {/* Formulaire produit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editProduct ? 'Modifier le produit' : 'Nouveau produit'}
        size="lg"
        footer={
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={createProduct.isPending || updateProduct.isPending}
            className="btn btn-primary w-full"
          >
            {createProduct.isPending || updateProduct.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        }
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nom du produit *" error={errors.name?.message} {...register('name')} />
          <Input label="Référence *" error={errors.reference?.message} {...register('reference')} />
          <Select
            label="Catégorie *"
            options={CATEGORIES}
            error={errors.category?.message}
            {...register('category')}
            placeholder="Choisir…"
          />
          <Input
            label="Unité (sac, m², kg…) *"
            error={errors.unit?.message}
            {...register('unit')}
          />
          <Input
            label="Prix de vente (FCFA) *"
            type="number"
            error={errors.sellingPrice?.message}
            {...register('sellingPrice')}
          />
          <Input
            label="Prix d'achat (FCFA)"
            type="number"
            error={errors.costPrice?.message}
            {...register('costPrice')}
          />
          <Input
            label="Stock minimum"
            type="number"
            error={errors.minStockLevel?.message}
            {...register('minStockLevel')}
          />
          <Input label="Description" {...register('description')} className="sm:col-span-2" />
        </form>
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteProduct.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        loading={deleteProduct.isPending}
        title="Supprimer le produit"
        message="Cette action est irréversible. Le produit sera retiré du catalogue."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
