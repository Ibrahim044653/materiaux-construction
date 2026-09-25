import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Eye, EyeOff, Smartphone } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import { useAdminStore } from '../stores/adminStore';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type LoginForm = z.infer<typeof loginSchema>;

const twoFaSchema = z.object({
  code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
});
type TwoFaForm = z.infer<typeof twoFaSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAdminStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [pendingUserId, setPendingUserId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const {
    register: register2fa,
    handleSubmit: handleSubmit2fa,
    formState: { errors: errors2fa, isSubmitting: isSubmitting2fa },
  } = useForm<TwoFaForm>({ resolver: zodResolver(twoFaSchema) });

  const onLogin = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      const result = res.data.data;

      if (result.requiresTwoFactor) {
        setPendingUserId(result.userId);
        setStep('2fa');
        return;
      }

      if (result.user?.role !== 'SUPER_ADMIN') {
        setError('Accès réservé aux Super Admins.');
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch (e) {
      setError(getApiError(e));
    }
  };

  const on2FA = async (data: TwoFaForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login/2fa', { userId: pendingUserId, token: data.code });
      const result = res.data.data;

      if (result.user?.role !== 'SUPER_ADMIN') {
        setError('Accès réservé aux Super Admins.');
        return;
      }

      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch (e) {
      setError(getApiError(e));
    }
  };

  return (
    <div className="min-h-screen bg-admin-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MatériauxPro</h1>
          <p className="text-gray-400 text-sm mt-1">Espace Administration</p>
        </div>

        {/* Card */}
        <div className="bg-admin-800 rounded-2xl border border-admin-700 p-6">
          {step === 'credentials' ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-5">Connexion Super Admin</h2>

              {error && (
                <div className="mb-4 p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    className="input"
                    placeholder="admin@materiaux.ci"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-danger-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="input pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-danger-400">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full py-3 text-base"
                >
                  {isSubmitting ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-primary-700/30 rounded-xl flex items-center justify-center">
                  <Smartphone size={20} className="text-primary-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Vérification 2FA</h2>
                  <p className="text-xs text-gray-400">Code de votre application TOTP</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit2fa(on2FA)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    className="input text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    {...register2fa('code')}
                  />
                  {errors2fa.code && (
                    <p className="mt-1 text-xs text-danger-400">{errors2fa.code.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting2fa}
                  className="btn btn-primary w-full py-3"
                >
                  {isSubmitting2fa ? 'Vérification…' : 'Vérifier'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                  }}
                  className="w-full text-sm text-gray-400 hover:text-gray-200 text-center"
                >
                  ← Retour à la connexion
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Accès réservé — MatériauxPro SaaS Admin
        </p>
      </div>
    </div>
  );
}
