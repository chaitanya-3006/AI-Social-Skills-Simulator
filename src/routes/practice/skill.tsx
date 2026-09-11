import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, MessageCircle, Mic, Ear, Users, ShieldAlert } from 'lucide-react';
import { skills } from '../../lib/mock-data';
import { useSimulationStore } from '../../lib/simulation-store';

export const Route = createFileRoute('/practice/skill')({
  component: SelectSkillComponent,
});

const iconMap: Record<string, React.ReactNode> = {
  'communication': <MessageCircle className="w-8 h-8 mb-4 text-violet-400" />,
  'confidence': <Mic className="w-8 h-8 mb-4 text-blue-400" />,
  'active-listening': <Ear className="w-8 h-8 mb-4 text-emerald-400" />,
  'small-talk': <Users className="w-8 h-8 mb-4 text-amber-400" />,
  'conflict': <ShieldAlert className="w-8 h-8 mb-4 text-rose-400" />,
};

function SelectSkillComponent() {
  const navigate = useNavigate();
  const { selectedSkill, setSkill } = useSimulationStore();

  const handleContinue = () => {
    if (selectedSkill) {
      navigate({ to: '/practice/scenario' });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      <div className="mb-8">
        <p className="text-sm font-medium text-secondary mb-2">Step 1 of 3</p>
        <h1 className="text-3xl font-bold mb-2">What would you like to practice?</h1>
        <p className="text-secondary text-lg">Select a core social skill to focus on for this session.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {skills.map((skill, index) => {
          const isSelected = selectedSkill?.id === skill.id;
          return (
            <div 
              key={skill.id}
              onClick={() => setSkill(skill)}
              className={`glass-card glass-card-interactive flex flex-col justify-center items-center text-center p-8 transition-all duration-300
                ${isSelected ? 'glass-card-selected scale-105' : ''}
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {iconMap[skill.id]}
              <h3 className="font-bold text-xl mb-2">{skill.name}</h3>
              <p className="text-sm text-secondary m-0">{skill.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex justify-end">
        <button 
          onClick={handleContinue}
          disabled={!selectedSkill}
          className={`btn btn-primary px-8 ${!selectedSkill ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
