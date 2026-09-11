export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Skill {
  id: string;
  name: string;
  score: number;
  description: string;
}

export interface Scenario {
  id: string;
  skillId: string;
  title: string;
  description: string;
  characterName: string;
  characterRole: string;
  characterStatus: string;
  characterTags: string[];
  avatarUrl: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export const skills: Skill[] = [
  { id: 'communication', name: 'Communication', score: 80, description: 'Express ideas clearly and effectively' },
  { id: 'confidence', name: 'Confidence', score: 70, description: 'Speak with assurance and presence' },
  { id: 'active-listening', name: 'Active Listening', score: 60, description: 'Understand and respond thoughtfully' },
  { id: 'small-talk', name: 'Small Talk', score: 90, description: 'Navigate casual social interactions' },
  { id: 'conflict', name: 'Conflict Handling', score: 55, description: 'De-escalate and resolve disagreements' }
];

export const scenarios: Scenario[] = [
  {
    id: 'networking-event',
    skillId: 'small-talk',
    title: 'Networking Event Mixer',
    description: 'You are at a professional mixer. Strike up a conversation with someone you haven\'t met before.',
    characterName: 'Alex',
    characterRole: 'College Student',
    characterStatus: 'Online',
    characterTags: ['Friendly', 'Talkative', 'Curious'],
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=b6e3f4'
  },
  {
    id: 'salary-negotiation',
    skillId: 'confidence',
    title: 'Salary Negotiation',
    description: 'You have been offered a job, but the salary is lower than expected. Negotiate for a higher offer.',
    characterName: 'Sarah',
    characterRole: 'HR Manager',
    characterStatus: 'Busy',
    characterTags: ['Professional', 'Firm', 'Fair'],
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=ffdfbf'
  },
  {
    id: 'group-project',
    skillId: 'conflict',
    title: 'Group Project Disagreement',
    description: 'A teammate is not pulling their weight on a project. Address the issue constructively.',
    characterName: 'Jordan',
    characterRole: 'Classmate',
    characterStatus: 'Offline',
    characterTags: ['Defensive', 'Stressed'],
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jordan&backgroundColor=c0aede'
  }
];

export const recentSessions = [
  { id: '1', scenarioTitle: 'Coffee Shop Chat', date: '2 hours ago', score: 8.5 },
  { id: '2', scenarioTitle: 'Networking Event Mixer', date: 'Yesterday', score: 7.2 },
  { id: '3', scenarioTitle: 'Job Interview Prep', date: '3 days ago', score: 9.0 }
];
