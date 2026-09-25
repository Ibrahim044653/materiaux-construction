import { Menu, Bell, Store } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      {/* Gauche : bouton menu mobile + titre */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden tap-target text-gray-500 hover:text-gray-700"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500 hidden md:flex">
          <Store size={16} />
          <span>Tous les magasins</span>
        </div>
      </div>

      {/* Droite : notifications + profil */}
      <div className="flex items-center gap-3">
        <button className="relative tap-target text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
}
