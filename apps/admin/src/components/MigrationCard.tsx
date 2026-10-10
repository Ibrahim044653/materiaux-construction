// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  CARTE TEMPORAIRE — A SUPPRIMER AVEC maintenance.routes.ts               ║
// ║  Declenche les migrations en attente sur la base de production depuis    ║
// ║  la session du super admin.                                              ║
// ╚══════════════════════════════════════════════════════════════════════════╝
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { api, getApiError } from '../lib/api';

interface Etat {
  appliquees: string[];
  enAttente: string[];
}

export default function MigrationCard() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<Etat>({
    queryKey: ['db', 'migrations'],
    queryFn: async () => (await api.get('/admin/db/migrations')).data.data as Etat,
  });

  const appliquer = useMutation({
    mutationFn: async () => (await api.post('/admin/db/migrations')).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db', 'migrations'] }),
  });

  const enAttente = data?.enAttente ?? [];

  return (
    <div className="admin-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-900/40 rounded-xl flex items-center justify-center">
          <Database size={20} className="text-primary-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Base de données</h2>
          <p className="text-gray-400 text-xs">État des migrations de schéma</p>
        </div>
      </div>

      {isLoading && <p className="text-gray-400 text-sm">Lecture de l'état…</p>}

      {error && (
        <div className="p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
          {getApiError(error)}
        </div>
      )}

      {data && enAttente.length === 0 && (
        <div className="flex items-center gap-2 text-success-400 text-sm">
          <CheckCircle size={16} />
          Base à jour — {data.appliquees.length} migrations appliquées
        </div>
      )}

      {data && enAttente.length > 0 && (
        <>
          <div className="flex items-start gap-2 p-3 mb-4 bg-warning-900/30 border border-warning-700 rounded-xl text-warning-400 text-sm">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {enAttente.length} migration{enAttente.length > 1 ? 's' : ''} en attente
              </p>
              <ul className="mt-1 font-mono text-xs opacity-90">
                {enAttente.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => appliquer.mutate()}
            disabled={appliquer.isPending}
            className="btn btn-primary"
          >
            {appliquer.isPending ? 'Application en cours…' : 'Appliquer les migrations'}
          </button>
        </>
      )}

      {appliquer.isError && (
        <div className="mt-4 p-3 bg-danger-900/30 border border-danger-700 rounded-xl text-danger-400 text-sm">
          {getApiError(appliquer.error)}
        </div>
      )}

      {appliquer.isSuccess && (
        <div className="mt-4 p-3 bg-success-900/30 border border-success-700 rounded-xl text-success-400 text-sm">
          Terminé. Les pages Produits, Stock et Caisse sont de nouveau opérationnelles.
        </div>
      )}
    </div>
  );
}
