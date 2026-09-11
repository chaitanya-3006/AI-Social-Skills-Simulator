import React, { useState } from 'react';
import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { MessageSquare, LayoutDashboard, LineChart, History, Settings, Menu, X, Sparkles } from 'lucide-react';
import { Toaster } from 'sonner';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isSessionActive = location.pathname.includes('/practice/session');

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/practice/skill', icon: MessageSquare, label: 'Practice' },
    { to: '/progress', icon: LineChart, label: 'Progress' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden text-sm">
      <Toaster theme="dark" position="top-right" />
      
      {/* Mobile Header */}
      {!isSessionActive && (
        <div className="md:hidden fixed top-0 w-full z-50 glass-card rounded-none border-t-0 border-l-0 border-r-0 flex items-center justify-between p-4 bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2">
            <Sparkles className="text-violet-400 w-5 h-5" style={{color: 'var(--accent-violet)'}} />
            <span className="font-bold text-lg text-gradient">SocialSim</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className={`
        fixed md:relative z-40 w-[var(--sidebar-width)] h-full glass-card rounded-none border-y-0 border-l-0
        flex-col justify-between py-6 px-4 transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isSessionActive ? 'hidden md:flex' : 'flex'}
      `} style={{ backgroundColor: 'var(--bg-primary)' }}>
        
        <div>
          <div className="flex items-center gap-2 px-2 mb-8 mt-12 md:mt-0">
            <Sparkles className="w-6 h-6" style={{color: 'var(--accent-violet)'}} />
            <div>
              <h1 className="font-bold text-xl text-gradient m-0">SocialSim</h1>
              <p className="text-xs text-secondary m-0">AI Social Skills Simulator</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-[var(--accent-violet-glow)] text-[var(--accent-violet-light)]' 
                      : 'text-secondary hover:text-white hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="glass-card mt-auto p-3 flex items-center gap-3" style={{ padding: '0.75rem' }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg" style={{ background: 'linear-gradient(to top right, var(--accent-violet), var(--accent-blue))'}}>
            C
          </div>
          <div>
            <p className="font-medium text-sm m-0">Chaitanya</p>
            <p className="text-xs text-secondary m-0">Pro Plan</p>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 h-full overflow-y-auto ${!isSessionActive ? 'pt-16 md:pt-0' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
