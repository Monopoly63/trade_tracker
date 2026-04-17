import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authRepo } from '@/lib/repository';
import { useTheme } from '@/lib/theme';
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
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    (async () => {
      const session = await authRepo.getSession();
      if (!session?.user) {
        navigate('/');
        return;
      }
      setUser(session.user);
    })();
  }, [navigate]);

  const handleSignOut = async () => {
    await authRepo.signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-primary">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex theme-bg-primary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300
          ${isDark ? 'border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]' : 'border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        <div className={`flex items-center h-16 border-b px-4 theme-border ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              <span className="font-bold theme-text-primary">TradeJournal</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="theme-text-secondary hover:theme-text-primary hidden lg:block">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={() => setSidebarOpen(false)} className="theme-text-secondary lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'bg-indigo-500/10 text-indigo-500'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-[var(--theme-bg-tertiary)]'
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t theme-border p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`theme-text-secondary hover:text-red-400 ${collapsed ? 'w-10 h-10 p-0' : 'w-full justify-start gap-2'}`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center h-14 border-b theme-border px-4 theme-bg-secondary">
          <button onClick={() => setSidebarOpen(true)} className="theme-text-secondary">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-bold theme-text-primary">TradeJournal</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}