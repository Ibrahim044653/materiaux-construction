import { useState } from 'react';
import { Plus, Package, Edit2, Trash2, Tags } from 'lucide-react';
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
import { useCategories } from '../../hooks/useCategories';
import { formatCFA } from '../../lib/utils';
import { getApiError } from '../../lib/api';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchBar } from '../../components/ui/SearchBar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useDebounce } from '../../hooks/useDebounce';
import { CategoryManager } from './CategoryManager';

const productSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  reference: z.string().min(1, 'Référence requise'),
  categoryId: z.string().optional(),
  unit: z.string().min(1, 'Unité requise'),
  sellPrice: z.coerce.number().min(1, 'Prix requis'),
  buyPrice: z.coerce.number().min(0),
  tva: z.coerce.number().min(0).max(100),
  alertThreshold: z.coerce.number().min(0),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  reference: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  unit: string;
  sellPrice: string;
  buyPrice: string;
  tva: string;
  description?: string;
  stockEntries?: { quantity: string; alertThreshold: string }[];
}

export default function ProduitsPage() {
  const { selectedStoreId } = useAuthStore();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProducts({
    storeId: selectedStoreId,
    search: debouncedSearch,
    categoryId,
    page,
  });
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const products = (data?.data ?? []) as Product[];
  const meta = data?.meta;
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({ resolver: zodResolver(productSchema) });

  const openCreate = () => {
    reset({
      name: '',
      reference: '',
      categoryId: '',
      unit: 'unité',
      sellPrice: 0,
      buyPrice: 0,
      tva: 18,
      alertThreshold: 5,
      description: '',
    });
    setEditProduct(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    const threshold = p.stockEntries?.[0]?.alertThreshold;
    reset({
      name: p.name,
      reference: p.reference,
      categoryId: p.categoryId ?? '',
      unit: p.unit,
      sellPrice: Number(p.sellPrice),
      buyPrice: Number(p.buyPrice),
      tva: Number(p.tva),
      alertThreshold: Number(threshold ?? 5),
      description: p.description ?? '',
    });
    setEditProduct(p);
    setError(null);
    setFormOpen(true);
  };

  const onSubmit = async (values: ProductForm) => {
    setError(null);
    // L'API attend les montants en chaîne (Decimal) pour éviter les arrondis
    const payload = {
      name: values.name,
      reference: values.reference,
      categoryId: values.categoryId || null,
      unit: values.unit,
      sellPrice: values.sellPrice.toFixed(2),
      buyPrice: values.buyPrice.toFixed(2),
      tva: values.tva,
      alertThreshold: values.alertThreshold,
      description: values.description || undefined,
    };

    try {
      if (editProduct) {
        await updateProduct.mutateAsync({ id: editProduct.id, data: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900">Catalogue produits</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoriesOpen(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Tags size={18} /> <span className="hidden sm:inline">Catégories</span>
          </button>
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} /> <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>
      </div>

      {error && !formOpen && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          className="flex-1"
          placeholder="Nom, référence…"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="input w-36"
        >
          <option value="">Toutes</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
                {p.category ? (
                  <Badge variant="primary">{p.category.name}</Badge>
                ) : (
                  <Badge variant="gray">Non classé</Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCFA(Number(p.sellPrice))}</p>
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
            disabled={saving}
            className="btn btn-primary w-full"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        }
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {error && (
            <Alert variant="danger" className="sm:col-span-2">
              {error}
            </Alert>
          )}
          <Input label="Nom du produit *" error={errors.name?.message} {...register('name')} />
          <Input label="Référence *" error={errors.reference?.message} {...register('reference')} />
          <Select
            label="Catégorie"
            options={categoryOptions}
            error={errors.categoryId?.message}
            placeholder="Non classé"
            hint={
              categoryOptions.length === 0
                ? 'Aucune catégorie — créez-en via le bouton « Catégories »'
                : undefined
            }
            {...register('categoryId')}
          />
          <Input
            label="Unité de vente *"
            placeholder="sac, kg, m², pièce…"
            error={errors.unit?.message}
            {...register('unit')}
          />
          <Input
            label="Prix de vente (FCFA) *"
            type="number"
            step="0.01"
            error={errors.sellPrice?.message}
            {...register('sellPrice')}
          />
          <Input
            label="Prix d'achat (FCFA)"
            type="number"
            step="0.01"
            hint="Sert au calcul automatique de la marge"
            error={errors.buyPrice?.message}
            {...register('buyPrice')}
          />
          <Input
            label="TVA (%)"
            type="number"
            step="0.01"
            error={errors.tva?.message}
            {...register('tva')}
          />
          <Input
            label="Stock minimum"
            type="number"
            hint="Alerte de réapprovisionnement, pour tous vos magasins"
            error={errors.alertThreshold?.message}
            {...register('alertThreshold')}
          />
          <Input label="Description" {...register('description')} className="sm:col-span-2" />
        </form>
      </Modal>

      {/* Gestion des catégories */}
      <CategoryManager open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />

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
        title="Retirer le produit"
        message="Le produit sera retiré du catalogue. Son historique de ventes est conservé."
        confirmLabel="Retirer"
      />
    </div>
  );
}
