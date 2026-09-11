import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Play, Shield, Zap, Flame, Loader2 } from 'lucide-react';
import { useSimulationStore } from '../../lib/simulation-store';
import { api } from '../../lib/api';
import type { Difficulty } from '../../lib/mock-data';

export const Route = createFileRoute('/practice/difficulty')({
  component: SelectDifficultyComponent,
});

const difficulties: { id: Difficulty; title: string; desc: string; icon: React.ReactNode; colorClass: string; bgClass: string }[] = [
  {
    id: 'easy',
    title: 'Easy',
    desc: 'Predictable responses, helpful hints available',
    icon: <Shield className="w-6 h-6" />,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
  {
    id: 'medium',
    title: 'Medium',
    desc: 'Realistic pacing, standard AI behavior',
    icon: <Zap className="w-6 h-6" />,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  {
    id: 'hard',
    title: 'Hard',
    desc: 'Challenging interactions, uncooperative at times',
    icon: <Flame className="w-6 h-6" />,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
  },
];

function SelectDifficultyComponent() {
  const navigate = useNavigate();
  const { selectedSkill, selectedScenario, difficulty, setDifficulty, setSessionId } = useSimulationStore();
  const [isStarting, setIsStarting] = useState(false);

  React.useEffect(() => {
    if (!selectedSkill || !selectedScenario) {
      navigate({ to: '/practice/skill' });
    }
  }, [selectedSkill, selectedScenario, navigate]);

  const handleBack = () => navigate({ to: '/practice/scenario' });

  const handleStart = async () => {
    if (!selectedScenario || !difficulty) return;
    setIsStarting(true);
    try {
      const result = await api.startSimulation(selectedScenario.id, difficulty);
      setSessionId(result.sessionId);
      navigate({ to: '/practice/session' });
    } catch (error) {
      console.error(error);
      setIsStarting(false);
    }
  };

  if (!selectedSkill || !selectedScenario) return null;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-400 mb-2">
          Step 3 of 3 •{' '}
          <span className="text-violet-400">{selectedSkill.name}</span>
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Select Difficulty</h1>
        <p className="text-slate-400 text-lg">Choose how challenging you want this simulation to be.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Difficulty Options */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {difficulties.map((level) => {
            const isSelected = difficulty === level.id;
            return (
              <div
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`glass-card glass-card-interactive p-5 flex items-center gap-5 transition-all duration-300 ${isSelected ? 'glass-card-selected' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${level.bgClass} ${level.colorClass}`}>
                  {level.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base mb-1">{level.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{level.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isSelected ? 'border-violet-500 bg-violet-500' : 'border-slate-600'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Simulation Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-8 flex flex-col gap-5">
            <h3 className="font-bold text-white text-base border-b border-white/10 pb-4">
              Simulation Summary
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill</p>
                <p className="font-semibold text-white text-sm">{selectedSkill.name}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scenario</p>
                <p className="font-semibold text-white text-sm leading-snug">{selectedScenario.title}</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Character</p>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedScenario.avatarUrl}
                    alt={selectedScenario.characterName}
                    className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-white text-sm leading-tight">{selectedScenario.characterName}</p>
                    <p className="text-xs text-slate-400">{selectedScenario.characterRole}</p>
                  </div>
                </div>
              </div>

              {difficulty && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Difficulty</p>
                  <div className={`w-max px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                    difficulty === 'easy' ? 'badge-easy' : difficulty === 'medium' ? 'badge-medium' : 'badge-hard'
                  }`}>
                    {difficulty}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleStart}
              disabled={!difficulty || isStarting}
              className={`w-full btn btn-primary justify-center mt-2 ${(!difficulty || isStarting) ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {isStarting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
              ) : (
                <>Start Simulation <Play className="w-4 h-4 fill-white" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button onClick={handleBack} className="btn btn-secondary px-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </div>
  );
}
