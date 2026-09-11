import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { Trophy, CheckCircle, AlertCircle, ArrowRight, Home, RefreshCcw, MessageSquare, Lightbulb, User } from 'lucide-react';
import { useSimulationStore } from '../../lib/simulation-store';
import { api } from '../../lib/api';

export const Route = createFileRoute('/practice/results')({
  component: ResultsComponent,
});

function ResultsComponent() {
  const navigate = useNavigate();
  const { sessionId, selectedScenario, clearSelection } = useSimulationStore();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [scoreCounter, setScoreCounter] = useState(0);

  useEffect(() => {
    if (!sessionId || !selectedScenario) {
      navigate({ to: '/' });
      return;
    }

    const loadEvaluation = async () => {
      try {
        const result = await api.getEvaluation(sessionId);
        setEvaluation(result);
        
        // Animate score counter
        let start = 0;
        const end = result.overallScore;
        const duration = 1500;
        const increment = end / (duration / 16);
        
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setScoreCounter(end);
            clearInterval(timer);
          } else {
            setScoreCounter(start);
          }
        }, 16);
      } catch (error) {
        console.error(error);
      }
    };

    loadEvaluation();
  }, [sessionId, selectedScenario, navigate]);

  const handlePracticeAgain = () => {
    clearSelection();
    navigate({ to: '/practice/skill' });
  };

  const handleBackHome = () => {
    clearSelection();
    navigate({ to: '/' });
  };

  if (!evaluation) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center gap-4 text-secondary">
          <div className="w-12 h-12 rounded-full border-4 border-secondary border-t-[var(--accent-violet)] animate-spin"></div>
          <p className="font-medium animate-pulse">Analyzing your interaction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[calc(100vh-80px)] pb-32 animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[rgba(139,92,246,0.1)] text-[var(--accent-violet-light)] mb-6 shadow-[var(--shadow-glow-violet)]">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Simulation Complete</h1>
        <p className="text-secondary text-lg">Here's how you handled the {selectedScenario?.title} scenario.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Score Overview */}
        <div className="glass-card flex flex-col items-center justify-center p-8 lg:col-span-1 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-violet-glow)] rounded-full blur-3xl"></div>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-6 relative z-10">Overall Score</h3>
          <div className="relative z-10 w-40 h-40 rounded-full border-[8px] border-[var(--bg-secondary)] flex items-center justify-center mb-6 shadow-xl"
               style={{ 
                 background: `conic-gradient(from 0deg, var(--accent-violet) ${scoreCounter * 36}deg, transparent ${scoreCounter * 36}deg)`,
                 borderRadius: '50%'
               }}
          >
            <div className="absolute inset-2 bg-[var(--bg-card)] rounded-full flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gradient">{scoreCounter.toFixed(1)}</span>
              <span className="text-secondary text-sm font-medium">/ 10</span>
            </div>
          </div>
          
          <div className="w-full space-y-4 relative z-10">
            {evaluation.skills.slice(0, 3).map((skill: any) => (
              <div key={skill.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary">{skill.name}</span>
                  <span className="font-bold">{skill.score}</span>
                </div>
                <div className="progress-bg h-1.5">
                  <div className="progress-fill" style={{ width: `${(skill.score / 10) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Evaluation */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 border-l-4 border-l-[var(--success)] relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <CheckCircle className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <CheckCircle className="w-5 h-5 text-[var(--success)]" />
              What You Did Well
            </h3>
            <ul className="space-y-3 relative z-10">
              {evaluation.whatYouDidWell.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-[var(--warning)] relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <AlertCircle className="w-32 h-32" />
            </div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
              Areas to Improve
            </h3>
            <ul className="space-y-3 relative z-10">
              {evaluation.areasToImprove.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-[var(--accent-violet)]" />
        Better Responses
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {evaluation.betterResponses.map((response: any, i: number) => (
          <div key={i} className="glass-card p-6 flex flex-col group hover:-translate-y-2 transition-all">
            <div className="badge bg-[rgba(255,255,255,0.1)] text-white w-max mb-4 group-hover:bg-[var(--accent-violet-glow)] group-hover:text-[var(--accent-violet-light)] transition-colors">
              {response.type} Approach
            </div>
            <p className="text-sm font-medium italic mb-2 relative">
              <span className="absolute -top-2 -left-2 text-2xl text-[var(--text-muted)] opacity-50 font-serif">"</span>
              {response.text}
              <span className="absolute -bottom-4 text-2xl text-[var(--text-muted)] opacity-50 font-serif">"</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-4 pt-8 border-t border-[var(--border-color)]">
        <button onClick={handleBackHome} className="btn btn-secondary px-8">
          <Home className="w-5 h-5" /> Back to Dashboard
        </button>
        <button onClick={handlePracticeAgain} className="btn btn-primary px-8">
          Practice Again <RefreshCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
