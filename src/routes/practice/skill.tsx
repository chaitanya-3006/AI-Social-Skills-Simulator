import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  ArrowRight, 
  MessageCircle, 
  Mic, 
  Ear, 
  Users, 
  ShieldAlert, 
  Sparkles 
} from 'lucide-react';
import { Skill } from '../../lib/mock-data';
import { api } from '../../lib/api';
import { useSimulationStore } from '../../lib/simulation-store';

export const Route = createFileRoute('/practice/skill')({
  component: SelectSkillComponent,
});

const iconMap: Record<string, React.ReactNode> = {
  'communication': <MessageCircle className="w-8 h-8 mb-4 text-violet-400" />,
  'message-circle': <MessageCircle className="w-8 h-8 mb-4 text-violet-400" />,
  'confidence': <Mic className="w-8 h-8 mb-4 text-blue-400" />,
  'mic': <Mic className="w-8 h-8 mb-4 text-blue-400" />,
  'active-listening': <Ear className="w-8 h-8 mb-4 text-emerald-400" />,
  'ear': <Ear className="w-8 h-8 mb-4 text-emerald-400" />,
  'small-talk': <Users className="w-8 h-8 mb-4 text-amber-400" />,
  'users': <Users className="w-8 h-8 mb-4 text-amber-400" />,
  'conflict': <ShieldAlert className="w-8 h-8 mb-4 text-rose-400" />,
  'shield-alert': <ShieldAlert className="w-8 h-8 mb-4 text-rose-400" />,
};

function SelectSkillComponent() {
  const navigate = useNavigate();
  const { selectedSkill, setSkill } = useSimulationStore();
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await api.getSkills();
        setSkillsList(data);
      } catch (e) {
        console.error('Failed to fetch skills', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const handleContinue = () => {
    if (selectedSkill) {
      navigate({ to: '/practice/scenario' });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[calc(100vh-80px)] flex flex-col animate-fade-in">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-400 mb-2">Step 1 of 3</p>
        <h1 className="text-3xl font-bold text-white mb-2">What would you like to practice?</h1>
        <p className="text-slate-400 text-lg">Select a core social skill to focus on for this session.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass-card p-8 h-56 animate-pulse flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 mb-4"></div>
              <div className="h-5 bg-white/10 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-white/10 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {skillsList.map((skill, index) => {
            const isSelected = selectedSkill?.id === skill.id;
            const iconKey = skill.icon || skill.id;
            const icon = iconMap[iconKey] || <Sparkles className="w-8 h-8 mb-4 text-violet-400" />;

            return (
              <div 
                key={skill.id}
                onClick={() => setSkill(skill)}
                className={`glass-card glass-card-interactive flex flex-col justify-center items-center text-center p-8 transition-all duration-300
                  ${isSelected ? 'glass-card-selected scale-105 ring-2 ring-violet-500' : ''}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {icon}
                <h3 className="font-bold text-xl text-white mb-2">{skill.name}</h3>
                <p className="text-sm text-slate-400 m-0 leading-relaxed">{skill.description}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-auto flex justify-end">
        <button 
          onClick={handleContinue}
          disabled={!selectedSkill || loading}
          className={`btn btn-primary px-8 ${!selectedSkill || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
