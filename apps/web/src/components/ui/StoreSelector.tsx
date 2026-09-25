import { useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

interface StoreData {
  id: string;
  name: string;
}

export function StoreSelector() {
  const { selectedStoreId, setSelectedStore: setSelectedStoreId } = useAuthStore();

  const { data: stores = [] } = useQuery<StoreData[]>({
    queryKey: ['stores-list'],
    queryFn: async () => {
      const res = await api.get('/stores');
      return res.data.data as StoreData[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (stores.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-3 py-2">
      <Store size={16} className="text-primary-600 flex-shrink-0" />
      <select
        value={selectedStoreId ?? ''}
        onChange={(e) => setSelectedStoreId(e.target.value)}
        className="bg-transparent text-sm font-medium text-primary-700 border-0 outline-none cursor-pointer"
      >
        <option value="">Tous les magasins</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
