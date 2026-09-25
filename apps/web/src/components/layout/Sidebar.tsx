import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  BarChart3,
  ClipboardList,
  LogOut,
  Settings,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { clsx } from 'clsx';

const navItems = [
  { to: '/tableau-de-bord', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/caisse', icon: ShoppingCart, label: 'Caisse' },
  { to: '/ventes', icon: ClipboardList, label: 'Ventes' },
  { to: '/stock', icon: Boxes, label: 'Stock' },
  { to: '/produits', icon: Package, label: 'Produits' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/fournisseurs', icon: Truck, label: 'Fournisseurs' },
  { to: '/rapports', icon: BarChart3, label: 'Rapports' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-primary-900 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-sm font-black text-primary-700">MP</span>
          </div>
          <span className="text-white font-bold text-lg">MatériauxPro</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-primary-300 hover:text-white tap-target"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-primary-800 p-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-primary-300 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <NavLink
          to="/profil"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary-200 hover:bg-primary-800 hover:text-white text-sm transition-all"
        >
          <Settings size={18} />
          Paramètres
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary-200 hover:bg-danger-600 hover:text-white text-sm transition-all"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
