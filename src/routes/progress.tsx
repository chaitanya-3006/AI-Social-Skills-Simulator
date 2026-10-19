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
  ShieldAlert,
  Play,
  Calendar,
  Zap
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

const getSkillLevel = (score: number, sessionsCount: number = 0) => {
  if (sessionsCount === 0 || score === 0) {
    return { label: 'Unrated', color: 'text-slate-400 bg-white/5 border-white/10', barColor: 'bg-slate-600' };
  }
  if (score >= 85) return { label: 'Master', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400' };
  if (score >= 70) return { label: 'Advanced', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', barColor: 'bg-gradient-to-r from-blue-500 to-cyan-400' };
  if (score >= 50) return { label: 'Intermediate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', barColor: 'bg-gradient-to-r from-amber-500 to-orange-400' };
  return { label: 'Developing', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', barColor: 'bg-gradient-to-r from-rose-500 to-red-400' };
};

const getScoreBadge = (avg: number) => {
  if (avg === 0) return { label: 'New Learner', color: 'text-slate-400 border-white/10 bg-white/5' };
  if (avg >= 8.5) return { label: 'Mastery Tier', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
  if (avg >= 7.5) return { label: 'Proficient Tier', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' };
  if (avg >= 6.0) return { label: 'Solid Tier', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  return { label: 'Developing Tier', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };
};

const badgeIconMap: Record<string, any> = {
  'trophy': Trophy,
  'shield-check': ShieldCheck,
  'flame': Flame,
  'target': Target,
  'sparkles': Sparkles,
  'award': Award
};

function ProgressComponent() {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeScorePoint, setActiveScorePoint] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getProgress();
        setProgress(data);
      } catch (e) {
        console.error('Failed to load progress', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const scorePoints = progress?.scoreHistory || [];
  const maxScoreInHistory = scorePoints.length > 0 ? Math.max(...scorePoints.map(p => p.score)) : 0;
  const recentAvg = scorePoints.length > 0 
    ? (scorePoints.slice(-3).reduce((acc, p) => acc + p.score, 0) / Math.min(3, scorePoints.length)).toFixed(1)
    : '0.0';

  const scoreTier = getScoreBadge(progress?.averageScore || 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in pb-28">
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
        <Link to="/practice/skill" className="btn btn-primary no-underline self-start md:self-auto shadow-lg shadow-violet-500/20">
          Start Practice Session <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Metrics Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {/* Total Sessions */}
        <div className="glass-card p-5 flex items-center gap-4 border border-white/5 hover:border-violet-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-violet-400">
            <LineChart className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-bold text-white m-0">
                {loading ? '...' : progress?.totalSessions || 0}
              </p>
              <span className="text-xs text-slate-500">completed</span>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="glass-card p-5 flex items-center gap-4 border border-white/5 hover:border-emerald-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Score</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-bold text-white m-0">
                {loading ? '...' : (progress?.averageScore ? `${progress.averageScore}/10` : '0.0/10')}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreTier.color}`}>
                {scoreTier.label}
              </span>
            </div>
          </div>
        </div>

        {/* Practice Streak */}
        <div className="glass-card p-5 flex items-center gap-4 border border-white/5 hover:border-amber-500/20 transition-all">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            (progress?.streakDays || 0) > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-500'
          }`}>
            <Flame className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Practice Streak</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-bold text-white m-0">
                {loading ? '...' : `${progress?.streakDays || 0} ${progress?.streakDays === 1 ? 'Day' : 'Days'}`}
              </p>
              {(progress?.streakDays || 0) > 0 ? (
                <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">Active</span>
              ) : (
                <span className="text-[10px] text-slate-500">Practice today!</span>
              )}
            </div>
          </div>
        </div>

        {/* Practice Time */}
        <div className="glass-card p-5 flex items-center gap-4 border border-white/5 hover:border-blue-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Practice Time</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-2xl font-bold text-white m-0">
                {loading ? '...' : (
                  (progress?.totalPracticeMinutes || 0) >= 60 
                    ? `${((progress?.totalPracticeMinutes || 0) / 60).toFixed(1)}h`
                    : `${progress?.totalPracticeMinutes || 0}m`
                )}
              </p>
              <span className="text-xs text-slate-500">focused</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Score Progression Timeline / Visualizer */}
      <section className="glass-card p-6 md:p-8 mb-10 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
              <TrendingUp className="w-5 h-5 text-violet-400" />
              Score Progression History
            </h2>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Your overall evaluation scores across consecutive simulation sessions
            </p>
          </div>
          {scorePoints.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                <span className="text-slate-500 mr-1.5">Highest:</span>
                <strong className="text-emerald-400 font-bold">{maxScoreInHistory.toFixed(1)}/10</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                <span className="text-slate-500 mr-1.5">Recent Avg:</span>
                <strong className="text-violet-300 font-bold">{recentAvg}/10</strong>
              </div>
            </div>
          )}
        </div>

        {scorePoints.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Zap className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-white m-0">No Completed Simulations Yet</p>
            <p className="text-xs text-slate-400 max-w-md m-0">
              Complete your first AI practice roleplay to start generating your personalized performance trend and evaluation breakdown.
            </p>
            <Link to="/practice/skill" className="btn btn-primary py-2 px-5 text-xs no-underline mt-2">
              Start First Simulation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Visual SVG Progress Bar / Graph */}
            <div className="relative pt-6 pb-2">
              <div className="h-28 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
                {scorePoints.map((pt, idx) => {
                  const heightPercent = Math.max(20, Math.min(100, (pt.score / 10) * 100));
                  const isHovered = activeScorePoint?.session_id === pt.sessionId;
                  const isHighest = pt.score === maxScoreInHistory;

                  return (
                    <div 
                      key={pt.sessionId || idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      onMouseEnter={() => setActiveScorePoint(pt)}
                      onMouseLeave={() => setActiveScorePoint(null)}
                    >
                      {/* Score Value Pill */}
                      <span className={`text-[11px] font-bold mb-1.5 transition-all ${
                        isHovered || isHighest ? 'text-violet-300 scale-110' : 'text-slate-400'
                      }`}>
                        {pt.score.toFixed(1)}
                      </span>

                      {/* Bar */}
                      <div className="w-full max-w-[48px] bg-white/5 rounded-t-lg relative overflow-hidden flex items-end">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                            isHighest 
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-glow-emerald' 
                              : (pt.score >= 7.5 ? 'bg-gradient-to-t from-violet-600 to-blue-500' : 'bg-gradient-to-t from-amber-600 to-amber-400')
                          } ${isHovered ? 'brightness-125' : ''}`}
                          style={{ height: mounted ? `${heightPercent}%` : '0%' }}
                        />
                      </div>

                      {/* Session index / date label */}
                      <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Details Card */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-slate-300">
                  {activeScorePoint ? (
                    <>
                      <strong>{activeScorePoint.title}</strong> • Score: <strong className="text-violet-300">{activeScorePoint.score}/10</strong> ({activeScorePoint.date})
                    </>
                  ) : (
                    <>
                      Hover over any bar to view individual session results. Showing last <strong>{scorePoints.length}</strong> sessions.
                    </>
                  )}
                </span>
              </div>
              <Link to="/history" className="text-violet-400 hover:text-violet-300 font-semibold no-underline flex items-center gap-1 flex-shrink-0">
                View Full Transcript History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: Skills Matrix + AI Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Skills Breakdown (2 cols) */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
              <Target className="w-5 h-5 text-violet-400" />
              Skill Mastery Breakdown
            </h2>
            <span className="text-xs text-slate-500">Based on evaluated roleplays</span>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-card p-5 h-20 animate-pulse bg-white/5" />
              ))
            ) : (
              progress?.skills.map((skill) => {
                const sessionsCount = skill.sessionsCount || 0;
                const scoreVal = skill.score || 0;
                const level = getSkillLevel(scoreVal, sessionsCount);
                const icon = skillIcons[skill.id] || <Sparkles className="w-5 h-5 text-violet-400" />;

                return (
                  <div key={skill.id} className="glass-card p-5 flex flex-col gap-3.5 border border-white/5 hover:border-violet-500/20 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-base leading-tight m-0">{skill.name}</h3>
                            <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              {sessionsCount === 0 ? 'Not yet practiced' : `${sessionsCount} ${sessionsCount === 1 ? 'session' : 'sessions'}`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 m-0 truncate">{skill.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${level.color}`}>
                          {level.label}
                        </span>
                        <div className="text-right">
                          <span className="text-base font-bold text-white">
                            {sessionsCount > 0 ? scoreVal : '--'}
                          </span>
                          <span className="text-xs text-slate-500 font-normal">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="progress-bg flex-1">
                        <div 
                          className={`progress-fill ${level.barColor}`} 
                          style={{ width: mounted && sessionsCount > 0 ? `${scoreVal}%` : '0%' }}
                        />
                      </div>
                      <Link 
                        to="/practice/scenario" 
                        search={{ skillId: skill.id }}
                        className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 no-underline px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-all flex items-center gap-1"
                      >
                        Practice <Play className="w-2.5 h-2.5" />
                      </Link>
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
          <div className="glass-card p-6 border-l-4 border-l-violet-500 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white m-0">AI Coach Growth Focus</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed m-0">
              {progress?.aiRecommendation?.message || (
                <>
                  Start with structured practice sessions to discover your conversational superpowers and target high-impact communication growth areas.
                </>
              )}
            </p>

            {progress?.aiRecommendation && (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Scenario</span>
                <p className="text-sm font-semibold text-white m-0">
                  {progress.aiRecommendation.suggestedScenarioTitle}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">Skill: {progress.aiRecommendation.focusSkillName}</span>
                  <span className="text-slate-600">•</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    progress.aiRecommendation.difficulty.toLowerCase() === 'hard' 
                      ? 'text-rose-400 bg-rose-500/10' 
                      : (progress.aiRecommendation.difficulty.toLowerCase() === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10')
                  }`}>
                    {progress.aiRecommendation.difficulty}
                  </span>
                </div>
              </div>
            )}

            <Link 
              to="/practice/scenario" 
              search={{ skillId: progress?.aiRecommendation?.focusSkillId || 'communication' }}
              className="btn btn-primary py-2.5 text-xs justify-center no-underline mt-1"
            >
              Practice Suggested Scenario <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Stats / Highlights Box */}
          <div className="glass-card p-6 border border-white/5">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 m-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Key Feedback Highlights
            </h3>
            <ul className="flex flex-col gap-3 text-xs text-slate-300 p-0 m-0 list-none">
              {(progress?.confidenceHighlights && progress.confidenceHighlights.length > 0) ? (
                progress.confidenceHighlights.map((hl, i) => (
                  <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span>{hl}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2.5 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span>Maintain comfortable pacing and pause deliberately before answering</span>
                  </li>
                  <li className="flex items-start gap-2.5 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                    <span>Ask curious open-ended questions to deepen rapport with your partner</span>
                  </li>
                  <li className="flex items-start gap-2.5 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <span>Validate the other person's emotions before proposing compromises</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Achievements & Badges */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
            <Award className="w-5 h-5 text-amber-400" />
            Milestones & Achievements
          </h2>
          <span className="text-xs text-slate-400">
            {progress?.badges ? `${progress.badges.filter(b => b.unlocked).length}/${progress.badges.length} Unlocked` : '0/6 Unlocked'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(progress?.badges || []).map((badge) => {
            const IconComponent = badgeIconMap[badge.icon] || Trophy;
            return (
              <div 
                key={badge.id}
                className={`glass-card p-5 flex flex-col justify-between gap-3 transition-all border ${
                  badge.unlocked 
                    ? 'border-amber-500/20 bg-amber-500/[0.04] shadow-sm' 
                    : 'border-white/5 opacity-60 grayscale-[0.6]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    badge.unlocked ? 'bg-amber-500/20 text-amber-400 shadow-glow-amber' : 'bg-white/5 text-slate-500'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {badge.unlocked ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      Locked
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white m-0 leading-tight">{badge.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-2 leading-relaxed">{badge.desc}</p>
                  <p className="text-[10px] font-semibold text-slate-500 m-0">
                    Status: <span className={badge.unlocked ? 'text-amber-400' : 'text-slate-400'}>{badge.progressText}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Practice Activity */}
      {progress?.recentActivity && progress.recentActivity.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0">
              <Calendar className="w-5 h-5 text-slate-400" />
              Recent Practice Sessions
            </h2>
            <Link to="/history" className="text-xs font-semibold text-violet-400 hover:text-violet-300 no-underline">
              View All History →
            </Link>
          </div>

          <div className="glass-card overflow-hidden border border-white/5">
            <div className="divide-y divide-white/5">
              {progress.recentActivity.map((act) => (
                <div key={act.sessionId} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 text-violet-400 font-bold text-xs">
                      {act.score.toFixed(1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white m-0 truncate">{act.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 m-0">{act.date}</p>
                    </div>
                  </div>

                  <Link 
                    to="/history" 
                    className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all no-underline flex items-center gap-1 flex-shrink-0"
                  >
                    Review <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
