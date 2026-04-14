import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authRepo } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, TrendingUp, BarChart3, Target,
  ShieldAlert, ClipboardList, Settings, LogOut, Menu, X, ChevronLeft,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trades', label: 'Trades', icon: TrendingUp },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/strategies', label: 'Strategies', icon: Target },
  { path: '/risk-review', label: 'Risk Review', icon: ShieldAlert },
  { path: '/reviews', label: 'Reviews', icon: ClipboardList },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    authRepo.getSession().then((session) => {
      if (!session?.user) {
        navigate('/');
        return;
      }
      setUser(session.user);
    });

    const { data } = authRepo.onAuthStateChange((_event, session) => {
      if (!session) navigate('/');
      else setUser(session.user);
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await authRepo.signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-[#1E1E2E] bg-[#111118] transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <div className={`flex items-center h-16 border-b border-[#1E1E2E] px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              <span className="font-bold text-lg">TradeJournal</span>
            </Link>
          )}
          {collapsed && <TrendingUp className="w-6 h-6 text-indigo-500" />}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-[#8B8BA7] hover:text-white h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#8B8BA7] hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-[#8B8BA7] hover:text-white hover:bg-white/5'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1E1E2E]">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`w-full text-[#8B8BA7] hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'px-0 justify-center' : 'justify-start'}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-[#1E1E2E] bg-[#111118] flex items-center px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#8B8BA7] hover:text-white mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-400">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}