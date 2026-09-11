import { create } from 'zustand';
import { Skill, Scenario, Difficulty, Message } from './mock-data';

interface SimulationState {
  selectedSkill: Skill | null;
  selectedScenario: Scenario | null;
  difficulty: Difficulty | null;
  sessionId: string | null;
  messages: Message[];
  
  setSkill: (skill: Skill) => void;
  setScenario: (scenario: Scenario) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setSessionId: (id: string) => void;
  addMessage: (msg: Message) => void;
  resetSession: () => void;
  clearSelection: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedSkill: null,
  selectedScenario: null,
  difficulty: null,
  sessionId: null,
  messages: [],
  
  setSkill: (skill) => set({ selectedSkill: skill }),
  setScenario: (scenario) => set({ selectedScenario: scenario }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setSessionId: (id) => set({ sessionId: id }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  
  resetSession: () => set({ sessionId: null, messages: [] }),
  clearSelection: () => set({ 
    selectedSkill: null, 
    selectedScenario: null, 
    difficulty: null,
    sessionId: null,
    messages: []
  })
}));
