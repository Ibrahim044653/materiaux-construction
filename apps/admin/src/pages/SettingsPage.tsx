import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Smartphone, CheckCircle, AlertTriangle, Key } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import { useAdminStore } from '../stores/adminStore';

const enableSchema = z.object({
  token: z.string().length(6, 'Code à 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
});
const disableSchema = z.object({
  token: z.string().length(6, 'Code à 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
});

type EnableForm = z.infer<typeof enableSchema>;
type DisableForm = z.infer<typeof disableSchema>;

interface SetupData {
  secret: string;
  otpAuthUrl: string;
  qrCode: string;
}

export default function SettingsPage() {
  const { user, setAuth, accessToken, refreshToken } = useAdminStore();
  const [step, setStep] = useState<'idle' | 'setup'>('idle');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const is2FAEnabled = user?.twoFactorEnabled ?? false;

  // Fetch QR code on demand
  const {
    data: setupData,
    isFetching: loadingQr,
    refetch: fetchSetup,
  } = useQuery<SetupData>({
    queryKey: ['2fa', 'setup'],
    queryFn: async () => {
      const res = await api.get('/auth/2fa/setup');
      return res.data.data as SetupData;
    },
    enabled: false,
  });

  const {
    register: regEnable,
    handleSubmit: hsEnable,
    formState: { errors: errEnable, isSubmitting: submittingEnable },
    reset: resetEnable,
  } = useForm<EnableForm>({ resolver: zodResolver(enableSchema) });

  const {
    register: regDisable,
    handleSubmit: hsDisable,
    formState: { errors: errDisable, isSubmitting: submittingDisable },
    reset: resetDisable,
  } = useForm<DisableForm>({ resolver: zodResolver(disableSchema) });

  const handleStartSetup = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setStep('setup');
    await fetchSetup();
  };

  const handleEnable = async (data: EnableForm) => {
    setErrorMsg('');
    try {
      const res = await api.post('/auth/2fa/enable', {
        secret: setupData?.secret,
        token: data.token,
      });
      const updatedUser = res.data.data?.user ?? { ...user, twoFactorEnabled: true };
      setAuth(updatedUser, accessToken!, refreshToken!);
      setStep('idle');
      setSuccessMsg('Authentification 2FA activée avec succès.');
      resetEnable();
    } catch (e) {
      setErrorMsg(getApiError(e));
    }
  };

  const handleDisable = async (data: DisableForm) => {
    setErrorMsg('');
    try {
      await api.post('/auth/2fa/disable', { token: data.token });
      const updatedUser = { ...user!, twoFactorEnabled: false };
      setAuth(updatedUser, accessToken!, refreshToken!);
      setSuccessMsg('Authentification 2FA désactivée.');
      resetDisable();
    } catch (e) {
      setErrorMsg(getApiError(e));
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-400 text-sm mt-1">Configuration du compte Super Admin</p>
      </div>

      {/* Profile card */}
      <div className="admin-card">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Key size={16} className="text-gray-400" />
          Compte administrateur
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-800 flex items-center justify-center text-white font-bold text-xl">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="badge bg-purple-900 text-purple-300 text-xs mt-1 inline-flex">
              SUPER_ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-success-900/20 border border-success-700 rounded-xl text-success-400">
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-danger-900/20 border border-danger-700 rounded-xl text-danger-400">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      {/* 2FA Section */}
      <div className="admin-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Smartphone size={16} className="text-gray-400" />
              Authentification à deux facteurs (2FA)
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Renforcez la sécurité de votre compte avec une application TOTP (Google Authenticator,
              Authy…)
            </p>
          </div>
          <span
            className={`badge flex-shrink-0 ${is2FAEnabled ? 'badge-success' : 'badge-danger'}`}
          >
            {is2FAEnabled ? 'Activée' : 'Désactivée'}
          </span>
        </div>

        {/* Not enabled: setup flow */}
        {!is2FAEnabled && (
          <>
            {step === 'idle' && (
              <button
                onClick={handleStartSetup}
                className="btn btn-primary flex items-center gap-2"
              >
                <Shield size={16} />
                Configurer la 2FA
              </button>
            )}

            {step === 'setup' && (
              <div className="space-y-4">
                {loadingQr && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {setupData && !loadingQr && (
                  <>
                    <div className="p-4 bg-admin-700 rounded-xl">
                      <p className="text-sm text-gray-300 mb-3">
                        1. Scannez ce QR code avec votre application TOTP
                      </p>
                      <div className="flex justify-center mb-3">
                        <img
                          src={setupData.qrCode}
                          alt="QR Code 2FA"
                          className="w-48 h-48 rounded-xl bg-white p-2"
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-center mb-1">
                        Ou entrez manuellement la clé :
                      </p>
                      <p className="text-center font-mono text-sm text-primary-300 bg-admin-900 rounded-lg px-3 py-2 select-all">
                        {setupData.secret}
                      </p>
                    </div>

                    <form onSubmit={hsEnable(handleEnable)} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          2. Entrez le code de confirmation
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="input text-center text-xl tracking-widest font-mono"
                          placeholder="000000"
                          {...regEnable('token')}
                        />
                        {errEnable.token && (
                          <p className="mt-1 text-xs text-danger-400">{errEnable.token.message}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('idle');
                            setErrorMsg('');
                          }}
                          className="btn btn-secondary flex-1"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={submittingEnable}
                          className="btn btn-primary flex-1"
                        >
                          {submittingEnable ? 'Activation…' : 'Activer la 2FA'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Enabled: disable flow */}
        {is2FAEnabled && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-warning-900/20 border border-warning-700 rounded-xl">
              <AlertTriangle size={16} className="text-warning-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-300">
                La 2FA est activée. Pour la désactiver, entrez le code de votre application.
              </p>
            </div>
            <form onSubmit={hsDisable(handleDisable)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Code TOTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input text-center text-xl tracking-widest font-mono"
                  placeholder="000000"
                  {...regDisable('token')}
                />
                {errDisable.token && (
                  <p className="mt-1 text-xs text-danger-400">{errDisable.token.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submittingDisable}
                className="btn bg-danger-700 hover:bg-danger-600 text-white flex items-center gap-2"
              >
                {submittingDisable ? 'Désactivation…' : 'Désactiver la 2FA'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
