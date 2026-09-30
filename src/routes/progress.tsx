import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  LineChart, 
  Sparkles, 
  Flame, 
  Clock, 
  Trophy, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  Target,
  MessageCircle,
  Mic,
  Ear,
  Users,
  ShieldAlert
} from 'lucide-react';
import { api } from '../lib/api';
import { UserProgressData } from '../lib/mock-data';

export const Route = createFileRoute('/progress')({
  component: ProgressComponent,
});

const skillIcons: Record<string, React.ReactNode> = {
  'communication': <MessageCircle className="w-5 h-5 text-violet-400" />,
  'confidence': <Mic className="w-5 h-5 text-blue-400" />,
  'active-listening': <Ear className="w-5 h-5 text-emerald-400" />,
  'small-talk': <Users className="w-5 h-5 text-amber-400" />,
  'conflict': <ShieldAlert className="w-5 h-5 text-rose-400" />,
};

const getSkillLevel = (score: number) => {
  if (score >= 85) return { label: 'Master', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (score >= 70) return { label: 'Advanced', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  if (score >= 50) return { label: 'Intermediate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { label: 'Developing', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
};

const BADGES = [
  { id: '1', title: 'Conversation Starter', desc: 'Completed your first 3 practice simulations', unlocked: true, icon: Trophy },
  { id: '2', title: 'Active Listener', desc: 'Maintained 8.5+ in Active Listening', unlocked: true, icon: ShieldCheck },
  { id: '3', title: 'Streak Champion', desc: 'Practiced 3+ consecutive days', unlocked: true, icon: Flame },
  { id: '4', title: 'Conflict De-escalator', desc: 'Complete a Hard difficulty disagreement session', unlocked: false, icon: Target },
];

function ProgressComponent() {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getProgress();
        setProgress(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-slate-400 font-medium mb-2 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Performance & Analytics
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Your Skills <span className="text-gradient">Progress</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track conversational mastery, practice consistency, and confidence growth
          </p>
        </div>
        <Link to="/practice/skill" className="btn btn-primary no-underline self-start md:self-auto">
          Start Practice Session <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Metrics Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-violet-400">
            <LineChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {loading ? '...' : progress?.totalSessions || 0}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {loading ? '...' : `${progress?.averageScore || 8.2}/10`}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Practice Streak</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {loading ? '...' : `${progress?.streakDays || 1} Days`}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Practice Time</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {loading ? '...' : `${progress?.totalPracticeMinutes || 30}m`}
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Skills Matrix + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Skills Breakdown (2 cols) */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-400" />
            Skill Mastery Breakdown
          </h2>

          <div className="flex flex-col gap-4">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-card p-5 h-20 animate-pulse bg-white/5" />
              ))
            ) : (
              progress?.skills.map((skill) => {
                const level = getSkillLevel(skill.score || 0);
                const icon = skillIcons[skill.id] || <Sparkles className="w-5 h-5 text-violet-400" />;

                return (
                  <div key={skill.id} className="glass-card p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          {icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-base leading-tight">{skill.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{skill.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${level.color}`}>
                          {level.label}
                        </span>
                        <span className="text-base font-bold text-white">
                          {skill.score}<span className="text-xs text-slate-500 font-normal">/100</span>
                        </span>
                      </div>
                    </div>

                    <div className="progress-bg">
                      <div 
                        className="progress-fill" 
                        style={{ width: mounted ? `${skill.score || 0}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: AI Coach Insight */}
        <section className="flex flex-col gap-6">
          {/* AI Growth Recommendation */}
          <div className="glass-card p-6 border-l-4 border-l-violet-500 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white m-0">AI Coach Growth Focus</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed m-0">
              Your <strong className="text-emerald-400">Small Talk</strong> and <strong className="text-blue-400">Active Listening</strong> scores are exceptional. To accelerate your social presence, focus on de-escalation in high-pressure scenarios.
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Practice</span>
              <p className="text-sm font-semibold text-white m-0">Group Project Disagreement</p>
              <p className="text-xs text-slate-400 m-0">Skill: Conflict Handling • Hard</p>
            </div>

            <Link to="/practice/skill" className="btn btn-primary py-2.5 text-xs justify-center no-underline mt-2">
              Practice Suggested Scenario <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Stats Box */}
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Confidence Highlights
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-slate-300 p-0 m-0 list-none">
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                <span>+15% improvement in open-ended question pacing</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1 flex-shrink-0" />
                <span>Reduced response hesitation during tough negotiations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
                <span>Consistently high empathy ratings across all characters</span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Achievements & Badges */}
      <section>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Milestones & Achievements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div 
                key={badge.id}
                className={`glass-card p-5 flex flex-col gap-3 transition-all ${
                  badge.unlocked ? 'border-amber-500/20 bg-amber-500/5' : 'opacity-50 grayscale'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    badge.unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {badge.unlocked && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Unlocked
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{badge.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{badge.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
