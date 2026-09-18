import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Sparkles, TrendingUp, Zap, MessageCircle, Mic, Ear, Users, ShieldAlert, Clock } from 'lucide-react';
import { recentSessions, Skill } from '../lib/mock-data';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/auth-store';

export const Route = createFileRoute('/')({
  component: DashboardComponent,
});

const skillIcons: Record<string, React.ReactNode> = {
  'communication': <MessageCircle className="w-5 h-5 text-violet-400" />,
  'message-circle': <MessageCircle className="w-5 h-5 text-violet-400" />,
  'confidence': <Mic className="w-5 h-5 text-blue-400" />,
  'mic': <Mic className="w-5 h-5 text-blue-400" />,
  'active-listening': <Ear className="w-5 h-5 text-emerald-400" />,
  'ear': <Ear className="w-5 h-5 text-emerald-400" />,
  'small-talk': <Users className="w-5 h-5 text-amber-400" />,
  'users': <Users className="w-5 h-5 text-amber-400" />,
  'conflict': <ShieldAlert className="w-5 h-5 text-rose-400" />,
  'shield-alert': <ShieldAlert className="w-5 h-5 text-rose-400" />,
};

function DashboardComponent() {
  const [mounted, setMounted] = useState(false);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const { user } = useAuthStore();

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const data = await api.getSkills();
        setSkillsList(data);
      } catch (err) {
        console.error('Failed to load skills', err);
      } finally {
        setLoadingSkills(false);
      }
    };

    loadSkills();
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const displayName = user?.name ? user.name.split(' ')[0] : 'Chaitanya';

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-slate-400 font-medium mb-2 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Welcome back
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Good afternoon,{' '}
            <span className="text-gradient">{displayName}</span>
          </h1>
        </div>
        <Link
          to="/practice/skill"
          className="btn btn-primary no-underline whitespace-nowrap self-start md:self-auto"
        >
          Start New Simulation <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Your Skills */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          Your Skills
        </h2>
        
        {loadingSkills ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-28 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
                <div className="h-2 bg-white/10 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {skillsList.slice(0, 4).map((skill, index) => {
              const iconKey = skill.icon || skill.id;
              const icon = skillIcons[iconKey] || <Sparkles className="w-5 h-5 text-violet-400" />;
              
              return (
                <div
                  key={skill.id}
                  className="glass-card p-5 flex flex-col gap-4"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm leading-tight truncate">{skill.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Social skill</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">Progress</span>
                      <span className="text-sm font-bold text-white">
                        {skill.score || 0}
                        <span className="text-slate-500 text-xs">/100</span>
                      </span>
                    </div>
                    <div className="progress-bg">
                      <div
                        className="progress-fill"
                        style={{ width: mounted ? `${skill.score || 0}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Practice + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Quick Practice */}
        <section className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-400" />
            Quick Practice
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="glass-card glass-card-interactive p-6 flex flex-col gap-4 group">
              <div className="flex items-start justify-between">
                <div className="badge badge-easy">Easy</div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-base mb-1.5">Coffee Shop Chat</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Practice making casual small talk with a barista while waiting for your order.
                </p>
              </div>
              <Link
                to="/practice/skill"
                className="text-blue-400 text-sm font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-200 mt-auto no-underline"
              >
                Practice <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Card 2 */}
            <div className="glass-card glass-card-interactive p-6 flex flex-col gap-4 group">
              <div className="flex items-start justify-between">
                <div className="badge badge-medium">Medium</div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white text-base mb-1.5">Networking Mixer</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Introduce yourself and find common ground at a professional tech meetup.
                </p>
              </div>
              <Link
                to="/practice/skill"
                className="text-blue-400 text-sm font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-200 mt-auto no-underline"
              >
                Practice <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Sessions */}
        <section className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Recent Sessions
          </h2>
          <div className="flex flex-col gap-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="glass-card glass-card-interactive p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm leading-tight truncate">{session.scenarioTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{session.date}</p>
                </div>
                <div className="flex-shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-lg text-sm">
                  {session.score}/10
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
