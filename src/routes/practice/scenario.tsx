import { useEffect, useState, useCallback, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Scenario } from '../../lib/mock-data';
import { api } from '../../lib/api';
import { useSimulationStore } from '../../lib/simulation-store';

export const Route = createFileRoute('/practice/scenario')({
  validateSearch: (search: Record<string, unknown>): { skillId?: string } => {
    return {
      skillId: typeof search.skillId === 'string' ? search.skillId : undefined,
    };
  },
  component: SelectScenarioComponent,
});

const TIER_BADGES = [
  { label: 'Warm-Up', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { label: 'Core Target', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { label: 'High Stakes', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
];

function SelectScenarioComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { selectedSkill, selectedScenario, setSkill, setScenario } = useSimulationStore();
  const [scenariosList, setScenariosList] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isFetchedRef = useRef(false);

  const fetchScenariosForSkill = useCallback(async (skillId: string, isRefresh = false) => {
    if (isRefresh) setIsRegenerating(true);
    else setLoading(true);

    try {
      // Generate 3 diverse personalized scenarios tailored to the selected skill
      const data = await api.generateScenarios(skillId);
      setScenariosList(data);
      if (data.length > 0) {
        setScenario(data[0]);
      }
    } catch (e) {
      console.error('Failed to load AI scenarios', e);
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  }, [setScenario]);

  useEffect(() => {
    const init = async () => {
      // If skillId query param is provided and doesn't match selectedSkill, resolve skill first
      if (search.skillId && (!selectedSkill || selectedSkill.id !== search.skillId)) {
        try {
          const sk = await api.getSkillById(search.skillId);
          if (sk) {
            setSkill(sk);
            isFetchedRef.current = true;
            fetchScenariosForSkill(sk.id);
            return;
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (!selectedSkill && !search.skillId) {
        navigate({ to: '/practice/skill' });
        return;
      }

      if (selectedSkill && !isFetchedRef.current) {
        isFetchedRef.current = true;
        fetchScenariosForSkill(selectedSkill.id);
      }
    };

    init();
  }, [selectedSkill, search.skillId, navigate, fetchScenariosForSkill, setSkill]);

  const handleBack = () => {
    navigate({ to: '/practice/skill' });
  };

  const handleContinue = () => {
    if (selectedScenario) {
      navigate({ to: '/practice/difficulty' });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1.5">
            <span>Step 2 of 3</span>
            <span>•</span>
            <span className="text-violet-400 font-semibold">{selectedSkill?.name || 'Selected Skill'}</span>
          </p>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Choose a Scenario
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" /> Diverse AI Scenarios
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            3 distinct real-world contexts generated specifically for {selectedSkill?.name || 'this skill'} (Warm-Up, Core Target, and High Stakes).
          </p>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={() => selectedSkill && fetchScenariosForSkill(selectedSkill.id, true)}
          disabled={loading || isRegenerating}
          className="btn btn-secondary text-xs flex items-center gap-2 self-start md:self-auto py-2.5 px-4 shadow-sm"
          title="Generate 3 completely new, diverse AI scenarios"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-violet-400' : ''}`} />
          {isRegenerating ? 'Generating New Scenarios...' : 'Explore New Scenarios'}
        </button>
      </div>

      {/* Scenarios List */}
      <div className="flex flex-col gap-4 mb-12">
        {loading || isRegenerating ? (
          <div className="flex flex-col items-center justify-center p-14 glass-card rounded-2xl border-dashed border-violet-500/30 gap-3">
            <Loader2 className="w-9 h-9 text-violet-400 animate-spin" />
            <p className="text-base font-bold text-white m-0">Generating Diverse Roleplay Scenarios...</p>
            <p className="text-xs text-slate-400 m-0 text-center max-w-md leading-relaxed">
              Synthesizing distinct settings, unique character roles, and realistic stakes tailored directly to {selectedSkill?.name}.
            </p>
          </div>
        ) : (
          scenariosList.map((scenario, index) => {
            const isSelected = selectedScenario?.id === scenario.id;
            const tier = TIER_BADGES[index % TIER_BADGES.length];

            return (
              <div 
                key={scenario.id}
                onClick={() => setScenario(scenario)}
                className={`glass-card glass-card-interactive p-6 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300 relative overflow-hidden cursor-pointer border
                  ${isSelected 
                    ? 'glass-card-selected ring-2 ring-violet-500 shadow-glow-purple bg-violet-600/10 border-violet-500/40' 
                    : 'border-white/5 hover:border-violet-500/20'}
                `}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <img 
                  src={scenario.avatarUrl} 
                  alt={scenario.characterName} 
                  className="w-16 h-16 rounded-2xl bg-slate-800 object-cover border border-white/10 flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
                      {tier.label}
                    </span>
                    <h3 className="font-bold text-white text-lg m-0">{scenario.title}</h3>
                    <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-violet-300">
                      With {scenario.characterName} • {scenario.characterRole}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-300 m-0 mb-3 leading-relaxed">{scenario.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {scenario.characterTags.map(tag => (
                      <span key={tag} className="text-xs px-2.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="md:ml-auto flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                    ${isSelected ? 'border-violet-500 bg-violet-500' : 'border-slate-600'}
                  `}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-auto flex justify-between gap-4">
        <button onClick={handleBack} className="btn btn-secondary px-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button 
          onClick={handleContinue}
          disabled={!selectedScenario || loading || isRegenerating}
          className="btn btn-primary px-8"
        >
          Continue to Difficulty <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
