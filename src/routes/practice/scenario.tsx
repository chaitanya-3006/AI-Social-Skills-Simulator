import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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

  // If no skill is selected, redirect to skill selection
  useEffect(() => {
    if (!selectedSkill) {
      navigate({ to: '/practice/skill' });
      return;
    }

    const fetchScenarios = async () => {
      try {
        const data = await api.getScenarios(selectedSkill.id);
        setScenariosList(data);
      } catch (e) {
        console.error('Failed to load scenarios', e);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [selectedSkill, navigate]);

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
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1.5">
          <span>Step 2 of 3</span>
          <span>•</span>
          <span className="text-violet-400 font-semibold">{selectedSkill?.name}</span>
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Choose a Scenario</h1>
        <p className="text-slate-400 text-lg">
          Select a realistic social situation to practice with an AI character.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-12">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 h-32 animate-pulse bg-white/5" />
          ))
        ) : (
          scenariosList.map((scenario, index) => {
            const isSelected = selectedScenario?.id === scenario.id;
            return (
              <div 
                key={scenario.id}
                onClick={() => setScenario(scenario)}
                className={`glass-card glass-card-interactive p-6 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300
                  ${isSelected ? 'glass-card-selected ring-2 ring-violet-500' : ''}
                `}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <img 
                  src={scenario.avatarUrl} 
                  alt={scenario.characterName} 
                  className="w-16 h-16 rounded-2xl bg-slate-800 object-cover border border-white/10 flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
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
          disabled={!selectedScenario || loading}
          className={`btn btn-primary px-8 ${!selectedScenario || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
