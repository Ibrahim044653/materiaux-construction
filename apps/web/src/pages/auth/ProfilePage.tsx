import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Bell, BellOff, CheckCircle, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { usePush } from '../../hooks/usePush';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requis'),
    newPassword: z.string().min(8, '8 caractères minimum'),
    confirm: z.string().min(1, 'Requis'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
type PwForm = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');
  const { state: pushState, subscribe, unsubscribe } = usePush();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  const changePassword = useMutation({
    mutationFn: async (data: PwForm) => {
      await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      setPwSuccess(true);
      setPwError('');
      reset();
      setTimeout(() => setPwSuccess(false), 4000);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPwError(msg ?? 'Erreur lors du changement de mot de passe');
    },
  });

  const roleLabel: Record<string, string> = {
    OWNER: 'Propriétaire',
    MANAGER: 'Gérant',
    CASHIER: 'Caissier',
    ACCOUNTANT: 'Comptable',
    SUPER_ADMIN: 'Super Administrateur',
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20 lg:pb-4">
      <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>

      {/* Infos utilisateur */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-primary-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
          <Shield size={16} className="text-primary-600" />
          <span className="text-sm font-medium text-gray-700">
            {roleLabel[user?.role ?? ''] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Modifier le mot de passe</h2>
        </div>

        {pwSuccess && (
          <Alert variant="success" className="mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              Mot de passe modifié avec succès.
            </div>
          </Alert>
        )}
        {pwError && (
          <Alert variant="danger" className="mb-4">
            {pwError}
          </Alert>
        )}

        <form onSubmit={handleSubmit((d) => changePassword.mutate(d))} className="space-y-3">
          <Input
            label="Mot de passe actuel"
            type="password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            error={errors.confirm?.message}
            {...register('confirm')}
          />
          <button
            type="submit"
            disabled={changePassword.isPending}
            className="btn btn-primary w-full"
          >
            {changePassword.isPending ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>

      {/* Notifications push */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Alertes de stock</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {pushState === 'subscribed'
                ? 'Vous recevez les alertes en temps réel'
                : pushState === 'unsupported'
                  ? 'Non supporté par ce navigateur'
                  : pushState === 'denied'
                    ? 'Notifications bloquées par le navigateur'
                    : 'Activez pour recevoir des alertes stock'}
            </p>
          </div>

          {pushState === 'subscribed' ? (
            <button
              onClick={() => unsubscribe.mutate()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium"
            >
              <BellOff size={16} />
              Désactiver
            </button>
          ) : (
            <button
              onClick={() => subscribe.mutate()}
              disabled={
                pushState === 'unsupported' || pushState === 'denied' || pushState === 'loading'
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 text-primary-600 text-sm font-medium disabled:opacity-50"
            >
              <Bell size={16} />
              {pushState === 'loading' ? 'Activation…' : 'Activer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
