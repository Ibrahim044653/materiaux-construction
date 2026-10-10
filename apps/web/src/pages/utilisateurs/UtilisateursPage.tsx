import { useState } from 'react';
import { Plus, UserCog, Edit2, Power } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
  type TeamUser,
  type UserRole,
} from '../../hooks/useUsers';
import { useStores } from '../../hooks/useStores';
import { useAuthStore } from '../../stores/authStore';
import { getApiError } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const ROLES: { value: UserRole; label: string; hint: string }[] = [
  { value: 'OWNER', label: 'Propriétaire', hint: 'Accès total, y compris marges et utilisateurs' },
  { value: 'MANAGER', label: 'Gérant', hint: 'Exploitation complète : ventes, stock, commandes' },
  { value: 'CASHIER', label: 'Caissier', hint: 'Caisse, ventes, consultation produits et clients' },
  { value: 'ACCOUNTANT', label: 'Comptable', hint: 'Rapports, trésorerie, créances, exports' },
];

const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role;

const baseSchema = {
  name: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'ACCOUNTANT']),
  storeId: z.string().optional(),
};

const createSchema = z.object({
  ...baseSchema,
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});

const editSchema = z.object(baseSchema);

type CreateForm = z.infer<typeof createSchema>;

export default function UtilisateursPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<TeamUser | null>(null);
  const [toggleUser, setToggleUser] = useState<TeamUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useUsers();
  const { data: stores = [] } = useStores();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleActive = useToggleUserActive();

  const users = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(editUser ? editSchema : createSchema) as never,
  });

  const openCreate = () => {
    reset({ name: '', email: '', phone: '', role: 'CASHIER', password: '', storeId: '' });
    setEditUser(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (u: TeamUser) => {
    reset({
      name: u.name,
      email: u.email,
      phone: u.phone ?? '',
      role: u.role,
      password: '',
      storeId: u.storeId ?? '',
    });
    setEditUser(u);
    setError(null);
    setFormOpen(true);
  };

  const onSubmit = async (values: CreateForm) => {
    setError(null);
    try {
      if (editUser) {
        await updateUser.mutateAsync({
          id: editUser.id,
          data: {
            name: values.name,
            phone: values.phone || undefined,
            role: values.role,
            storeId: values.storeId || null,
          },
        });
      } else {
        await createUser.mutateAsync({
          email: values.email,
          name: values.name,
          phone: values.phone || undefined,
          role: values.role,
          password: values.password,
          storeId: values.storeId || undefined,
        });
      }
      setFormOpen(false);
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const confirmToggle = async () => {
    if (!toggleUser) return;
    try {
      await toggleActive.mutateAsync(toggleUser.id);
      setToggleUser(null);
    } catch (err) {
      setError(getApiError(err));
      setToggleUser(null);
    }
  };

  const saving = createUser.isPending || updateUser.isPending;
  const storeOptions = [
    { value: '', label: 'Tous les magasins' },
    ...stores.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500">Donnez à chacun son compte et son niveau d'accès.</p>
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
        <TableSkeleton rows={4} cols={4} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Aucun utilisateur"
          description="Créez les comptes de vos gérants et caissiers."
          action={
            <button onClick={openCreate} className="btn btn-primary">
              Ajouter un utilisateur
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span className="col-span-2">Utilisateur</span>
            <span>Rôle</span>
            <span>Magasin</span>
            <span className="text-right">Actions</span>
          </div>
          {users.map((u) => (
            <div key={u.id} className="card flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {u.name}
                  {u.id === currentUser?.id && (
                    <span className="ml-2 text-xs font-normal text-gray-400">(vous)</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <div className="hidden sm:block">
                <Badge variant={u.isActive ? 'primary' : 'gray'}>{roleLabel(u.role)}</Badge>
              </div>
              <div className="hidden lg:block text-sm text-gray-500 truncate">
                {u.store?.name ?? 'Tous'}
              </div>
              <div className="hidden xl:block text-xs text-gray-400">
                {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Jamais connecté'}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(u)}
                  className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setToggleUser(u)}
                  disabled={u.id === currentUser?.id}
                  className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent"
                  title={u.isActive ? 'Désactiver' : 'Réactiver'}
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
        title={editUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
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

          <Input label="Nom complet *" error={errors.name?.message} {...register('name')} />
          <Input
            label="Email *"
            type="email"
            disabled={!!editUser}
            hint={editUser ? "L'email ne peut pas être modifié" : undefined}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input label="Téléphone" error={errors.phone?.message} {...register('phone')} />
          {!editUser && (
            <Input
              label="Mot de passe *"
              type="password"
              hint="8 caractères minimum"
              error={errors.password?.message}
              {...register('password')}
            />
          )}
          <Select
            label="Rôle *"
            options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
            error={errors.role?.message}
            {...register('role')}
          />
          <Select
            label="Magasin"
            options={storeOptions}
            hint="Laisser vide pour un accès à tous les magasins"
            error={errors.storeId?.message}
            {...register('storeId')}
          />

          <div className="sm:col-span-2 rounded-xl bg-gray-50 p-3 space-y-1">
            {ROLES.map((r) => (
              <p key={r.value} className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">{r.label}</span> — {r.hint}
              </p>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={confirmToggle}
        loading={toggleActive.isPending}
        variant={toggleUser?.isActive ? 'danger' : 'warning'}
        title={toggleUser?.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}
        message={
          toggleUser?.isActive
            ? "L'utilisateur ne pourra plus se connecter. Son historique de ventes est conservé."
            : "L'utilisateur pourra de nouveau se connecter."
        }
        confirmLabel={toggleUser?.isActive ? 'Désactiver' : 'Réactiver'}
      />
    </div>
  );
}
