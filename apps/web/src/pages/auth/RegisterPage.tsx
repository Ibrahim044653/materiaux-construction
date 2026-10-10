import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { LoginResponse } from '@boutikpro/shared';

const schema = z.object({
  shopName: z.string().min(2, 'Nom de la boutique requis'),
  storeName: z.string().optional(),
  ownerName: z.string().min(2, 'Votre nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      api.post<{ data: LoginResponse }>('/auth/register', data).then((r) => r.data.data),
    onSuccess: ({ user, accessToken, refreshToken }) => {
      setAuth(user, accessToken, refreshToken);
      navigate('/tableau-de-bord', { replace: true });
    },
    onError: (err) => {
      setError('root', { message: getApiError(err) });
    },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Créer ma boutique</h2>
      <p className="text-sm text-gray-500 mb-6">
        Quelques informations et vous pouvez commencer à vendre.
      </p>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        {errors.root && (
          <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom de votre commerce
          </label>
          <input
            {...register('shopName')}
            className={`input ${errors.shopName ? 'input-error' : ''}`}
            placeholder="Quincaillerie KOUASSI & Fils"
            autoComplete="organization"
          />
          {errors.shopName && (
            <p className="mt-1 text-xs text-danger-600">{errors.shopName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom du premier magasin <span className="text-gray-400">(facultatif)</span>
          </label>
          <input {...register('storeName')} className="input" placeholder="Boutique Cocody" />
          <p className="mt-1 text-xs text-gray-500">
            Laissez vide pour reprendre le nom du commerce. Vous pourrez en ajouter d'autres
            ensuite.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Votre nom</label>
          <input
            {...register('ownerName')}
            className={`input ${errors.ownerName ? 'input-error' : ''}`}
            placeholder="Kouassi Michel"
            autoComplete="name"
          />
          {errors.ownerName && (
            <p className="mt-1 text-xs text-danger-600">{errors.ownerName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
          <input
            {...register('email')}
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="vous@exemple.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Téléphone <span className="text-gray-400">(facultatif)</span>
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="input"
            placeholder="07 00 00 00 00"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              8 caractères minimum, avec une majuscule et un chiffre.
            </p>
          )}
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? <Loader2 size={18} className="animate-spin" /> : null}
          {isPending ? 'Création…' : 'Créer ma boutique'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          Vous avez déjà un compte ?{' '}
          <Link to="/connexion" className="text-primary-700 hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
