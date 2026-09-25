import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { api, getApiError } from '../../lib/api';

const schema = z.object({ email: z.string().email('Email invalide') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/forgot-password', data),
    onSuccess: () => setSent(true),
    onError: (err) => setError('root', { message: getApiError(err) }),
  });

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="mx-auto mb-4 text-success-500" size={48} />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
        <p className="text-sm text-gray-500 mb-6">
          Si cet email existe, vous recevrez un lien de réinitialisation dans quelques minutes.
        </p>
        <Link to="/connexion" className="btn-primary w-full">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Mot de passe oublié</h2>
      <p className="text-sm text-gray-500 mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        {errors.root && (
          <div className="p-3 rounded-xl bg-danger-50 text-danger-600 text-sm">
            {errors.root.message}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input {...register('email')} type="email" className="input" placeholder="vous@exemple.com" />
          {errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending && <Loader2 size={18} className="animate-spin" />}
          {isPending ? 'Envoi...' : 'Envoyer le lien'}
        </button>
        <Link to="/connexion" className="block text-center text-sm text-primary-700 hover:underline">
          Retour à la connexion
        </Link>
      </form>
    </div>
  );
}
