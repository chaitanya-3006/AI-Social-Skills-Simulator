import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  Sparkles, 
  User, 
  Sliders, 
  Trash2, 
  LogOut, 
  Shield, 
  Save 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../lib/auth-store';

export const Route = createFileRoute('/settings')({
  component: SettingsComponent,
});

function SettingsComponent() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [name, setName] = useState(user?.name || 'Chaitanya');
  const [email] = useState(user?.email || 'chaitanya@example.com');
  const [defaultDifficulty, setDefaultDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    () => (localStorage.getItem('socialsim_default_difficulty') as 'easy' | 'medium' | 'hard') || 'medium'
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('socialsim_default_difficulty', defaultDifficulty);
    toast.success('Settings saved successfully!');
  };

  const handleClearCache = () => {
    localStorage.removeItem('socialsim_mock_users');
    toast.success('Simulation cache cleared.');
  };

  const handleSignOut = () => {
    logout();
    toast.info('Signed out.');
    navigate({ to: '/login' });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="mb-10">
        <p className="text-slate-400 font-medium mb-2 flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-violet-400" />
          Preferences & Configuration
        </p>
        <h1 className="text-4xl font-bold text-white leading-tight">
          Application <span className="text-gradient">Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Customize simulation preferences, account information, and audio parameters
        </p>
      </header>

      <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
        {/* Profile Card */}
        <section className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">User Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage your personal information and plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed opacity-75"
              />
            </div>
          </div>

          {/* Membership Tier badge */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-violet-400" />
              <div>
                <p className="text-xs font-bold text-white">SocialSim Pro Member</p>
                <p className="text-[11px] text-slate-400">Unlimited practice sessions and advanced evaluation analytics</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Active
            </span>
          </div>
        </section>

        {/* Simulation Preferences */}
        <section className="glass-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Simulation Defaults</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control how AI characters pace and interact in practice</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Default Difficulty */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Default Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDefaultDifficulty(diff)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      defaultDifficulty === diff
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-glow-purple'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Speech Speed */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                AI Persona Response Rhythm
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setSpeechSpeed(speed)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-medium capitalize transition-all border ${
                      speechSpeed === speed
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed === 'normal' ? 'Natural Pacing' : speed === 'fast' ? 'Rapid Exchanges' : 'Deliberate & Slow'}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-Scroll in Chat</p>
                  <p className="text-xs text-slate-400">Keep latest messages in view automatically</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-violet-600 focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-white">Sound Effects & Typing Cues</p>
                  <p className="text-xs text-slate-400">Audible confirmation for messages and evaluation reveal</p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={(e) => setSoundEffects(e.target.checked)}
                  className="rounded border-white/10 bg-white/5 text-violet-600 focus:ring-0 w-4 h-4"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Data & Privacy Actions */}
        <section className="glass-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-4">Account & Data Controls</h2>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleClearCache}
              className="btn btn-secondary text-xs flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              Clear Local Session Cache
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleSignOut}
                className="btn btn-secondary text-xs flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex justify-end gap-4">
          <button type="submit" className="btn btn-primary px-8">
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
