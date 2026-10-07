import { useEffect, useState, useCallback, useRef } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Scenario } from '../../lib/mock-data';
import { api } from '../../lib/api';
import { useSimulationStore } from '../../lib/simulation-store';

export const Route = createFileRoute('/practice/scenario')({
  component: SelectScenarioComponent,
});

function SelectScenarioComponent() {
  const navigate = useNavigate();
  const { selectedSkill, selectedScenario, setScenario } = useSimulationStore();
  const [scenariosList, setScenariosList] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isFetchedRef = useRef(false);

  const fetchScenarios = useCallback(async (isRefresh = false) => {
    if (!selectedSkill) return;
    if (isRefresh) setIsRegenerating(true);
    else setLoading(true);

    try {
      // Generate 3 personalized scenarios taking user past performance into consideration
      const data = await api.generateScenarios(selectedSkill.id);
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
  }, [selectedSkill, setScenario]);

  useEffect(() => {
    if (!selectedSkill) {
      navigate({ to: '/practice/skill' });
      return;
    }
    if (!isFetchedRef.current) {
      isFetchedRef.current = true;
      fetchScenarios();
    }
  }, [selectedSkill, navigate, fetchScenarios]);

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
            <span className="text-violet-400 font-semibold">{selectedSkill?.name}</span>
          </p>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Choose a Scenario
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" /> AI Tailored
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            3 scenarios dynamically generated based on your past performance and skill level.
          </p>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={() => fetchScenarios(true)}
          disabled={loading || isRegenerating}
          className="btn btn-secondary text-xs flex items-center gap-2 self-start md:self-auto py-2.5 px-4"
          title="Generate 3 new AI scenarios"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-violet-400' : ''}`} />
          {isRegenerating ? 'Generating 3 New...' : 'Regenerate Scenarios'}
        </button>
      </div>

      {/* Scenarios List */}
      <div className="flex flex-col gap-4 mb-12">
        {loading || isRegenerating ? (
          <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl border-dashed border-violet-500/30 gap-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-sm font-bold text-white m-0">Generating 3 Personalized Scenarios with AI...</p>
            <p className="text-xs text-slate-400 m-0 text-center max-w-md">
              Analyzing your past simulation scores, difficulty metrics, and skill strengths to tailor scenarios for {selectedSkill?.name}.
            </p>
          </div>
        ) : (
          scenariosList.map((scenario, index) => {
            const isSelected = selectedScenario?.id === scenario.id;

            return (
              <div 
                key={scenario.id}
                onClick={() => setScenario(scenario)}
                className={`glass-card glass-card-interactive p-6 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300 relative overflow-hidden cursor-pointer
                  ${isSelected ? 'glass-card-selected ring-2 ring-violet-500 shadow-glow-purple bg-violet-600/10' : ''}
                `}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <img 
                  src={scenario.avatarUrl} 
                  alt={scenario.characterName} 
                  className="w-16 h-16 rounded-2xl bg-slate-800 object-cover border border-white/10 flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
          className={`btn btn-primary px-8 ${!selectedScenario || loading || isRegenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
