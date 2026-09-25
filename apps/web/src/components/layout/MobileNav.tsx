import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

const mobileNavItems = [
  { to: '/tableau-de-bord', icon: LayoutDashboard, label: 'Accueil' },
  { to: '/caisse',          icon: ShoppingCart,    label: 'Caisse' },
  { to: '/stocks',          icon: Package,         label: 'Stocks' },
  { to: '/clients',         icon: Users,           label: 'Clients' },
  { to: '/rapports',        icon: BarChart3,       label: 'Rapports' },
];

export function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 pb-safe-bottom">
      <div className="flex items-center justify-around">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 py-2 px-3 flex-1 min-h-[56px] justify-center transition-colors',
                isActive ? 'text-primary-700' : 'text-gray-400'
              )
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
