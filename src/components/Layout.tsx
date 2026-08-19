import React, { useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useSearch } from '../store/SearchContext';
import { 
  LogOut, 
  LayoutDashboard, 
  ClipboardList, 
  AlertTriangle, 
  Package, 
  Users,
  Menu,
  X,
  Search,
  Store,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, logout, updateUser } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      try {
        const res = await fetch(`/api/users/${user.id}/avatar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64String })
        });
        if (res.ok) {
          updateUser({ ...user, avatar: base64String });
        } else {
          alert('Falha ao atualizar foto de perfil.');
        }
      } catch (error) {
        console.error("Avatar upload failed", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const promoterLinks = [
    { name: 'Dashboard Geral', path: '/promoter/dashboard', icon: LayoutDashboard },
    { name: 'Validade Crítica', path: '/promoter/validity', icon: AlertTriangle },
    { name: 'Formulários Dinâmicos', path: '/promoter/forms', icon: ClipboardList },
    { name: 'Materiais / EPIs', path: '/promoter/requests', icon: Package },
  ];

  const supervisorLinks = [
    { name: 'Dashboard Geral', path: '/supervisor/dashboard', icon: LayoutDashboard },
    { name: 'Gestão de Equipe', path: '/supervisor/team', icon: Users },
    { name: 'Gestão de Lojas', path: '/supervisor/stores', icon: Store },
    { name: 'Solicitações', path: '/supervisor/requests', icon: Package },
    { name: 'Formulários Dinâmicos', path: '/supervisor/forms', icon: ClipboardList },
  ];

  const links = user?.role === 'supervisor' ? supervisorLinks : promoterLinks;

  return (
    <div className="min-h-screen bg-coke-darker text-coke-white flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-[240px] bg-coke-black border-r border-coke-gray">
        <div className="p-6 flex items-center justify-center border-b border-coke-gray">
          <img src="/logo-solar.png" alt="Solar" className="h-[40px] object-contain" />
        </div>
        
        <nav className="flex-1 py-5 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 transition-colors text-sm",
                  isActive 
                    ? "text-coke-white bg-gradient-to-r from-coke-red/10 to-transparent border-l-[3px] border-coke-red" 
                    : "text-text-dim hover:text-coke-white border-l-[3px] border-transparent"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-coke-gray text-[11px] text-text-dim">
          v1.0.0-Beta
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[70px] bg-coke-black border-b border-coke-gray flex items-center justify-between px-4 z-50">
        <img src="/logo-solar.png" alt="Solar" className="h-[30px] object-contain" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-coke-white">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[70px] bg-coke-black z-40 flex flex-col">
          <nav className="flex-1 py-5 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-6 py-4 transition-colors text-base",
                    isActive 
                      ? "text-coke-white bg-gradient-to-r from-coke-red/10 to-transparent border-l-[3px] border-coke-red" 
                      : "text-text-dim hover:text-coke-white border-l-[3px] border-transparent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-6 border-t border-coke-gray">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-coke-gray text-coke-white font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-[70px] md:pt-0 bg-coke-darker">
        <header className="hidden md:flex h-[70px] border-b border-coke-gray bg-coke-black items-center justify-between px-8 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-dim" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-coke-gray border-none py-2 pl-10 pr-4 rounded-full text-coke-white w-[300px] outline-none text-sm placeholder-text-dim focus:ring-1 focus:ring-coke-red transition-all"
              placeholder="Buscar Loja, SKU ou Promotor..."
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[13px] font-bold text-coke-white">{user?.name}</div>
              <span className="text-[10px] uppercase bg-coke-red px-2 py-0.5 rounded font-bold text-white">
                {user?.role === 'supervisor' ? 'Supervisor Regional' : 'Promotor'}
              </span>
            </div>
            <div 
              className="w-10 h-10 rounded-full bg-coke-gray border-2 border-coke-red overflow-hidden relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {user?.avatar && <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            <button onClick={handleLogout} className="ml-2 text-text-dim hover:text-coke-red transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
