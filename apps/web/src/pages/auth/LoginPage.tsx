import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { LoginResponse } from '@materiaux/shared';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      api.post<{ data: LoginResponse }>('/auth/login', data).then((r) => r.data.data),
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
      <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion</h2>
      <p className="text-sm text-gray-500 mb-6">Accédez à votre espace de gestion</p>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        {errors.root && (
          <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm">
            {errors.root.message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Adresse email
          </label>
          <input
            {...register('email')}
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="vous@exemple.com"
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            to="/mot-de-passe-oublie"
            className="text-sm text-primary-700 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? <Loader2 size={18} className="animate-spin" /> : null}
          {isPending ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
