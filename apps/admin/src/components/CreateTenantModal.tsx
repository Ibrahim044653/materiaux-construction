import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Copy, Eye, EyeOff, RefreshCw, X } from 'lucide-react';
import { api, getApiError } from '../lib/api';

// Reprend exactement le contrat de POST /tenants (createSchema cote API).
const schema = z.object({
  name: z.string().min(2, 'Nom du commerce requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
  storeName: z.string().optional(),
  ownerName: z.string().min(2, 'Nom du propriétaire requis'),
  ownerEmail: z.string().email('Email invalide'),
  ownerPassword: z.string().min(8, '8 caractères minimum'),
});

type FormValues = z.infer<typeof schema>;

function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

interface Props {
  onClose: () => void;
}

export default function CreateTenantModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  // Recapitulatif affiche apres creation : le super admin doit pouvoir
  // transmettre les acces au commercant sans les retaper de memoire.
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'STARTER' },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        phone: values.phone?.trim() || undefined,
        storeName: values.storeName?.trim() || undefined,
      };
      await api.post('/tenants', payload);
      return { email: values.ownerEmail, password: values.ownerPassword };
    },
    onSuccess: (acces) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      setCreated(acces);
      setError('');
    },
    onError: (e) => setError(getApiError(e)),
  });

  const copyAcces = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(
      `BoutikPro — https://boutikpro-web.vercel.app\nIdentifiant : ${created.email}\nMot de passe : ${created.password}`
    );
    setCopied(true);
  };

  if (created) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-admin-800 border border-admin-700 rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success-900/40 rounded-xl flex items-center justify-center">
              <Check size={20} className="text-success-400" />
            </div>
            <h3 className="text-base font-semibold text-white">Boutique créée</h3>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Transmettez ces accès au commerçant. Le mot de passe ne sera plus affiché après la
            fermeture de cette fenêtre.
          </p>
          <div className="bg-admin-900 border border-admin-600 rounded-xl p-4 space-y-2 text-sm mb-4">
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Adresse</span>
              <span className="text-gray-200">boutikpro-web.vercel.app</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Identifiant</span>
              <span className="text-white font-medium break-all">{created.email}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Mot de passe</span>
              <span className="text-white font-mono break-all">{created.password}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={copyAcces} className="btn btn-secondary flex-1">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button onClick={onClose} className="btn btn-primary flex-1">
              Terminer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-admin-800 border border-admin-700 rounded-2xl p-6 max-w-lg w-full my-8">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-900/40 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-primary-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Nouveau tenant</h3>
              <p className="text-gray-400 text-xs">Commerce, premier magasin et propriétaire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-admin-700 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Le commerce</p>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Nom du commerce *</label>
            <input className="input" placeholder="Quincaillerie KOUASSI" {...register('name')} />
            {errors.name && <p className="text-danger-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email du commerce *</label>
              <input className="input" placeholder="contact@exemple.ci" {...register('email')} />
              {errors.email && (
                <p className="text-danger-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Téléphone</label>
              <input className="input" placeholder="07 00 00 00 00" {...register('phone')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Plan *</label>
              <select className="input" {...register('plan')}>
                <option value="STARTER">STARTER</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Premier magasin</label>
              <input
                className="input"
                placeholder={watch('name')?.trim() || 'Boutique Yopougon'}
                {...register('storeName')}
              />
              <p className="text-gray-500 text-xs mt-1">Vide : reprend le nom du commerce</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
            Le propriétaire
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Nom complet *</label>
              <input className="input" placeholder="Kouassi Michel" {...register('ownerName')} />
              {errors.ownerName && (
                <p className="text-danger-400 text-xs mt-1">{errors.ownerName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email de connexion *</label>
              <input
                className="input"
                placeholder="michel@exemple.ci"
                {...register('ownerEmail')}
              />
              {errors.ownerEmail && (
                <p className="text-danger-400 text-xs mt-1">{errors.ownerEmail.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Mot de passe *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  autoComplete="new-password"
                  {...register('ownerPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue('ownerPassword', generatePassword(), { shouldValidate: true });
                  setShowPassword(true);
                }}
                className="btn btn-secondary whitespace-nowrap"
              >
                <RefreshCw size={14} />
                Générer
              </button>
            </div>
            {errors.ownerPassword && (
              <p className="text-danger-400 text-xs mt-1">{errors.ownerPassword.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex-1">
              {mutation.isPending ? 'Création…' : 'Créer la boutique'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
