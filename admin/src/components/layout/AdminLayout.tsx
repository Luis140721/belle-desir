import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Tag, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/products')) return 'Productos';
    if (path.includes('/orders')) return 'Órdenes';
    if (path.includes('/categories')) return 'Categorías';
    return 'Panel de Administración';
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/products', label: 'Productos', icon: <Package size={18} /> },
    { to: '/admin/orders', label: 'Órdenes', icon: <ShoppingBag size={18} /> },
    { to: '/admin/categories', label: 'Categorías', icon: <Tag size={18} /> },
  ];

  const formattedTime = time.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  });

  return (
    <div className="flex h-screen bg-bd-dark overflow-hidden">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[240px] bg-bd-darkest border-r border-bd-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-bd-border">
            <h1 className="text-2xl font-bold text-bd-text font-serif">Belle Désir</h1>
            <div className="mt-4 flex items-center gap-3 p-2 rounded-lg bg-bd-medium border border-bd-border">
              <div className="w-8 h-8 rounded-full bg-bd-purple flex items-center justify-center text-white">
                <UserIcon size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-bd-text truncate">{user?.name}</p>
                <p className="text-xs text-bd-muted truncate">Administrador</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150
                  ${isActive 
                    ? 'bg-bd-purple text-bd-text shadow-lg shadow-bd-purple/20' 
                    : 'text-bd-muted hover:bg-bd-border hover:text-bd-text'}
                `}
              >
                {link.icon}
                <span className="font-medium">{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout Section */}
          <div className="p-4 border-t border-bd-border">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-bd-muted hover:bg-bd-error/10 hover:text-bd-error rounded-lg transition-all duration-150"
            >
              <LogOut size={18} />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-bd-darkest border-b border-bd-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-bd-text"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-bd-text">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-mono text-bd-purple font-semibold">{formattedTime}</p>
              <p className="text-[10px] text-bd-muted uppercase tracking-wider">Hora Colombia</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-bd-medium p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
