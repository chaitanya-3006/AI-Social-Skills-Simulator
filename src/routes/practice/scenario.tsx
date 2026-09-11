import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { scenarios } from '../../lib/mock-data';
import { useSimulationStore } from '../../lib/simulation-store';

export const Route = createFileRoute('/practice/scenario')({
  component: SelectScenarioComponent,
});

function SelectScenarioComponent() {
  const navigate = useNavigate();
  const { selectedSkill, selectedScenario, setScenario } = useSimulationStore();

  // If no skill is selected, user shouldn't be here
  React.useEffect(() => {
    if (!selectedSkill) {
      navigate({ to: '/practice/skill' });
    }
  }, [selectedSkill, navigate]);

  const filteredScenarios = scenarios.filter(s => s.skillId === selectedSkill?.id);
  // Fallback to all scenarios if none match perfectly for demo purposes
  const displayScenarios = filteredScenarios.length > 0 ? filteredScenarios : scenarios;

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
        <p className="text-sm font-medium text-secondary mb-2">Step 2 of 3 • {selectedSkill?.name}</p>
        <h1 className="text-3xl font-bold mb-2">Choose a scenario</h1>
        <p className="text-secondary text-lg">Select a situation to practice your skills.</p>
      </div>

      <div className="flex flex-col gap-4 mb-12">
        {displayScenarios.map((scenario, index) => {
          const isSelected = selectedScenario?.id === scenario.id;
          return (
            <div 
              key={scenario.id}
              onClick={() => setScenario(scenario)}
              className={`glass-card glass-card-interactive p-6 flex flex-col md:flex-row gap-6 items-start md:items-center transition-all duration-300
                ${isSelected ? 'glass-card-selected' : ''}
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img 
                src={scenario.avatarUrl} 
                alt={scenario.characterName} 
                className="w-16 h-16 rounded-full bg-slate-800 object-cover border-2 border-[var(--border-color)]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-lg m-0">{scenario.title}</h3>
                  <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    With {scenario.characterName}
                  </div>
                </div>
                <p className="text-sm text-secondary m-0 mb-3">{scenario.description}</p>
                <div className="flex flex-wrap gap-2">
                  {scenario.characterTags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="md:ml-auto">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]' : 'border-[var(--text-muted)]'}
                `}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex justify-between">
        <button onClick={handleBack} className="btn btn-secondary px-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <button 
          onClick={handleContinue}
          disabled={!selectedScenario}
          className={`btn btn-primary px-8 ${!selectedScenario ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
