import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAdminStore } from '../stores/adminStore';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/tenants', icon: Building2, label: 'Tenants' },
  { to: '/users', icon: Users, label: 'Utilisateurs' },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export function AdminLayout() {
  const { user, logout, refreshToken } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      /* ignore */
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-admin-800 border-r border-admin-700 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-admin-700">
          <div className="w-9 h-9 bg-primary-700 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">MatériauxPro</p>
            <p className="text-gray-400 text-xs">Administration</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-admin-700'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-admin-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-danger-400 hover:bg-admin-700 text-sm transition-all"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto bg-admin-900 p-6">
        <Outlet />
      </main>
    </div>
  );
}
