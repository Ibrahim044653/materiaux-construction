import { useState } from 'react';
import { Plus, Check, X, Edit2, Trash2, Tags } from 'lucide-react';
import { CATEGORY_PRESETS } from '../../lib/categoryPresets';
import {
  useCategories,
  useCreateCategory,
  useCreateCategories,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories';
import { getApiError } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryManager({ open, onClose }: CategoryManagerProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const createCategories = useCreateCategories();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await run(async () => {
      await createCategory.mutateAsync({ name });
      setNewName('');
    });
  };

  const handleRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    await run(async () => {
      await updateCategory.mutateAsync({ id, data: { name } });
      setEditingId(null);
    });
  };

  const applyPreset = async (names: string[]) => {
    if (names.length === 0) return;
    await run(() => createCategories.mutateAsync(names));
  };

  return (
    <Modal open={open} onClose={onClose} title="Catégories de produits" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Vos catégories sont libres : créez celles qui correspondent à votre activité.
        </p>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Ajout */}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Nom de la catégorie"
            maxLength={60}
            className="input flex-1"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || createCategory.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>

        {/* Jeux de démarrage, uniquement sur un catalogue vierge */}
        {!isLoading && categories.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">
              Démarrer avec un jeu de catégories prêt à l'emploi :
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => applyPreset(preset.categories)}
                  disabled={createCategories.isPending}
                  className="btn btn-secondary text-xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Ce ne sont que des suggestions — vous pourrez tout renommer ou supprimer.
            </p>
          </div>
        )}

        {/* Liste */}
        {isLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Chargement…</p>
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Aucune catégorie"
            description="Les produits peuvent rester « non classés », mais les catégories facilitent la recherche et les rapports."
          />
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-gray-100"
              >
                {editingId === c.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRename(c.id);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      maxLength={60}
                      autoFocus
                      className="input flex-1"
                    />
                    <button
                      onClick={() => handleRename(c.id)}
                      disabled={updateCategory.isPending}
                      className="tap-target w-9 h-9 rounded-lg text-success-600 hover:bg-success-50 flex items-center justify-center"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c._count?.products ?? 0} produit(s)</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingId(c.id);
                        setEditingName(c.name);
                        setError(null);
                      }}
                      className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 flex items-center justify-center"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => run(() => deleteCategory.mutateAsync(c.id))}
                      disabled={deleteCategory.isPending}
                      className="tap-target w-9 h-9 rounded-lg text-gray-400 hover:text-danger-600 hover:bg-danger-50 flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
