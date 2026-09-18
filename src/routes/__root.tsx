import { useState, useEffect } from 'react';
import { createRootRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { 
  MessageSquare, 
  LayoutDashboard, 
  LineChart, 
  History, 
  Settings, 
  Menu, 
  X, 
  Sparkles, 
  LogIn, 
  LogOut 
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../lib/auth-store';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isSessionActive = location.pathname.includes('/practice/session');
  
  const { user, isAuthenticated, logout, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/practice/skill', icon: MessageSquare, label: 'Practice' },
    { to: '/progress', icon: LineChart, label: 'Progress' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    toast.info('You have been signed out.');
    navigate({ to: '/login' });
  };

  const getInitial = (name?: string) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden text-sm">
      <Toaster theme="dark" position="top-right" />
      
      {/* Mobile Header */}
      {!isSessionActive && (
        <div className="md:hidden fixed top-0 w-full z-50 glass-card rounded-none border-t-0 border-l-0 border-r-0 flex items-center justify-between p-4 bg-[var(--bg-primary)]">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Sparkles className="text-violet-400 w-5 h-5" style={{ color: 'var(--accent-violet)' }} />
            <span className="font-bold text-lg text-gradient">SocialSim</span>
          </Link>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 no-underline"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav 
        className={`
          fixed md:relative z-40 w-[var(--sidebar-width)] h-full glass-card rounded-none border-y-0 border-l-0
          flex flex-col justify-between py-6 px-4 transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSessionActive ? 'hidden md:flex' : 'flex'}
        `} 
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 px-2 mb-8 mt-12 md:mt-0 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center shadow-glow-purple flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gradient m-0 leading-tight">SocialSim</h1>
              <p className="text-xs text-slate-400 m-0">AI Social Skills Simulator</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all no-underline ${
                    isActive 
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold shadow-glow-purple' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Block at bottom of sidebar */}
        <div className="mt-auto pt-4 border-t border-white/10">
          {isAuthenticated && user ? (
            <div className="glass-card p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0"
                >
                  {getInitial(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm m-0 truncate leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-400 m-0 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary py-2.5 text-xs justify-center no-underline font-semibold"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In / Register
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 h-full overflow-y-auto ${!isSessionActive ? 'pt-16 md:pt-0' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
