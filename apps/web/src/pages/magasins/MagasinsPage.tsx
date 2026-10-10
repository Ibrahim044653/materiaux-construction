import { useState } from 'react';
import { Plus, Store as StoreIcon, Edit2, Power, MapPin, Phone, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStores, useCreateStore, useUpdateStore, type Store } from '../../hooks/useStores';
import { getApiError } from '../../lib/api';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const storeSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type StoreForm = z.infer<typeof storeSchema>;

export default function MagasinsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editStore, setEditStore] = useState<Store | null>(null);
  const [toggleStore, setToggleStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: stores = [], isLoading } = useStores();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreForm>({ resolver: zodResolver(storeSchema) });

  const openCreate = () => {
    reset({ name: '', address: '', phone: '' });
    setEditStore(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (s: Store) => {
    reset({ name: s.name, address: s.address ?? '', phone: s.phone ?? '' });
    setEditStore(s);
    setError(null);
    setFormOpen(true);
  };

  const onSubmit = async (values: StoreForm) => {
    setError(null);
    try {
      if (editStore) {
        await updateStore.mutateAsync({ id: editStore.id, data: values });
      } else {
        await createStore.mutateAsync(values);
      }
      setFormOpen(false);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const confirmToggle = async () => {
    if (!toggleStore) return;
    try {
      await updateStore.mutateAsync({
        id: toggleStore.id,
        data: { isActive: !toggleStore.isActive },
      });
      setToggleStore(null);
    } catch (err) {
      setError(getApiError(err));
      setToggleStore(null);
    }
  };

  const saving = createStore.isPending || updateStore.isPending;

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes magasins</h1>
          <p className="text-sm text-gray-500">
            Chaque magasin a son propre stock, ses ventes et ses rapports.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      {error && !formOpen && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={StoreIcon}
          title="Aucun magasin"
          description="Créez votre premier point de vente pour commencer à enregistrer du stock et des ventes."
          action={
            <button onClick={openCreate} className="btn btn-primary">
              Créer un magasin
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stores.map((s) => (
            <div key={s.id} className="card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <StoreIcon size={18} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.name}</p>
                  <Badge variant={s.isActive ? 'success' : 'gray'}>
                    {s.isActive ? 'Actif' : 'Désactivé'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-500">
                {s.address && (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="flex-shrink-0" /> {s.address}
                  </p>
                )}
                {s.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="flex-shrink-0" /> {s.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Users size={14} className="flex-shrink-0" />
                  {s._count?.users ?? 0} utilisateur(s) rattaché(s)
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => openEdit(s)}
                  className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} /> Modifier
                </button>
                <button
                  onClick={() => setToggleStore(s)}
                  className="tap-target w-10 h-10 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 flex items-center justify-center"
                  title={s.isActive ? 'Désactiver' : 'Réactiver'}
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editStore ? 'Modifier le magasin' : 'Nouveau magasin'}
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
        <form className="space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          <Input
            label="Nom du magasin *"
            placeholder="Ex : Boutique Cocody"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input label="Adresse" error={errors.address?.message} {...register('address')} />
          <Input label="Téléphone" error={errors.phone?.message} {...register('phone')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toggleStore}
        onClose={() => setToggleStore(null)}
        onConfirm={confirmToggle}
        loading={updateStore.isPending}
        variant={toggleStore?.isActive ? 'danger' : 'warning'}
        title={toggleStore?.isActive ? 'Désactiver le magasin' : 'Réactiver le magasin'}
        message={
          toggleStore?.isActive
            ? 'Le magasin ne sera plus proposé en caisse. Son historique de ventes et son stock sont conservés.'
            : 'Le magasin sera de nouveau disponible en caisse.'
        }
        confirmLabel={toggleStore?.isActive ? 'Désactiver' : 'Réactiver'}
      />
    </div>
  );
}
