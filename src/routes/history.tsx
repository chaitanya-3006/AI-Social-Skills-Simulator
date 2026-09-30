import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  History as HistoryIcon, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowRight, 
  X, 
  MessageSquare, 
  Trophy, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Calendar,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import { SessionHistoryItem, SessionHistoryDetail } from '../lib/mock-data';

export const Route = createFileRoute('/history')({
  component: HistoryComponent,
});

function HistoryComponent() {
  const [historyList, setHistoryList] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('all');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('all');

  // Modal inspection state
  const [activeSessionDetail, setActiveSessionDetail] = useState<SessionHistoryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getHistory();
        setHistoryList(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openSessionDetail = async (session: SessionHistoryItem) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getHistoryDetail(session.id);
      if (detail) {
        setActiveSessionDetail(detail);
      } else {
        // Fallback detail constructed from item
        const fallbackEval = await api.getEvaluation(session.id);
        setActiveSessionDetail({
          id: session.id,
          scenarioId: session.scenarioId,
          scenarioTitle: session.scenarioTitle,
          skillId: session.skillId,
          skillName: session.skillName,
          difficulty: session.difficulty,
          date: session.date,
          messages: [
            { id: '1', role: 'ai', content: `Hello! I'm ${session.characterName}.`, timestamp: session.date },
            { id: '2', role: 'user', content: `Hi ${session.characterName}, great to connect with you.`, timestamp: session.date }
          ],
          evaluation: fallbackEval
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredHistory = historyList.filter((item) => {
    const matchesSearch = item.scenarioTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.skillName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSkill = selectedSkillFilter === 'all' || item.skillId === selectedSkillFilter;
    const matchesDiff = selectedDifficultyFilter === 'all' || item.difficulty === selectedDifficultyFilter;

    return matchesSearch && matchesSkill && matchesDiff;
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-slate-400 font-medium mb-2 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Session Logs
          </p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Practice <span className="text-gradient">History</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review past conversations, AI evaluation breakdowns, and coach suggestions
          </p>
        </div>
        <Link to="/practice/skill" className="btn btn-primary no-underline self-start md:self-auto">
          Start New Simulation <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Filter & Search Toolbar */}
      <section className="glass-card p-4 mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scenario, character, or skill..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Skill Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedSkillFilter}
            onChange={(e) => setSelectedSkillFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all" className="bg-slate-900">All Skills</option>
            <option value="communication" className="bg-slate-900">Communication</option>
            <option value="confidence" className="bg-slate-900">Confidence</option>
            <option value="active-listening" className="bg-slate-900">Active Listening</option>
            <option value="small-talk" className="bg-slate-900">Small Talk</option>
            <option value="conflict" className="bg-slate-900">Conflict Handling</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficultyFilter}
            onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="all" className="bg-slate-900">All Difficulties</option>
            <option value="easy" className="bg-slate-900">Easy</option>
            <option value="medium" className="bg-slate-900">Medium</option>
            <option value="hard" className="bg-slate-900">Hard</option>
          </select>
        </div>
      </section>

      {/* History List */}
      <section className="flex flex-col gap-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 h-24 animate-pulse bg-white/5" />
          ))
        ) : filteredHistory.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <HistoryIcon className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-white">No sessions found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              {searchQuery ? 'Try clearing your search query or filters.' : 'You haven’t completed any simulation sessions yet.'}
            </p>
            <Link to="/practice/skill" className="btn btn-primary mt-4 text-xs no-underline">
              Start First Simulation
            </Link>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => openSessionDetail(item)}
              className="glass-card glass-card-interactive p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
            >
              {/* Left: Avatar + Title */}
              <div className="flex items-center gap-4">
                <img
                  src={item.avatarUrl}
                  alt={item.characterName}
                  className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 object-cover flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-white text-base leading-tight group-hover:text-violet-300 transition-colors">
                      {item.scenarioTitle}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      With {item.characterName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                    <span className="text-violet-400 font-medium">{item.skillName}</span>
                    <span>•</span>
                    <span className="capitalize">{item.difficulty}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Score + Action */}
              <div className="flex items-center gap-4 self-end md:self-auto flex-shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
                  <div className="text-emerald-400 font-bold text-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                    {item.score}/10
                  </div>
                </div>
                <button className="btn btn-secondary py-2 px-3 text-xs flex items-center gap-1">
                  View Review <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Session Detail Modal */}
      {(activeSessionDetail || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col bg-[var(--bg-secondary)] border-white/20 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                  Session Review • {activeSessionDetail?.skillName}
                </p>
                <h2 className="text-xl font-bold text-white mt-1">
                  {activeSessionDetail?.scenarioTitle}
                </h2>
              </div>
              <button
                onClick={() => setActiveSessionDetail(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
                  <p className="text-sm">Loading session transcript and evaluation...</p>
                </div>
              ) : (
                <>
                  {/* Evaluation Highlights */}
                  {activeSessionDetail?.evaluation && (
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" /> Overall Score
                        </span>
                        <span className="text-xl font-bold text-emerald-400">
                          {activeSessionDetail.evaluation.overallScore}/10
                        </span>
                      </div>

                      {/* Strengths */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" /> What You Did Well
                        </span>
                        <ul className="text-xs text-slate-300 pl-4 list-disc space-y-1">
                          {activeSessionDetail.evaluation.whatYouDidWell.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Areas to Improve
                        </span>
                        <ul className="text-xs text-slate-300 pl-4 list-disc space-y-1">
                          {activeSessionDetail.evaluation.areasToImprove.map((a, idx) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-violet-400" /> Conversation Transcript
                    </h3>

                    <div className="flex flex-col gap-3">
                      {activeSessionDetail?.messages.map((m) => {
                        const isUser = m.role === 'user';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[11px] text-slate-500 mb-1">
                              {isUser ? 'You' : 'AI Character'}
                            </span>
                            <div
                              className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                                isUser
                                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-br-none shadow-glow-purple'
                                  : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
                              }`}
                            >
                              {m.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alternative Responses */}
                  {activeSessionDetail?.evaluation?.betterResponses && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-violet-400" /> Coach's Alternate Response Examples
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {activeSessionDetail.evaluation.betterResponses.map((r, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                              {r.type}
                            </span>
                            <p className="text-xs text-slate-300 italic m-0">"{r.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setActiveSessionDetail(null)}
                className="btn btn-secondary py-2 px-5 text-xs"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
