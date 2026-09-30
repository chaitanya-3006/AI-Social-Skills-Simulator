export type Difficulty = 'easy' | 'medium' | 'hard';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user_id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface Skill {
  id: string;
  name: string;
  score: number;
  description: string;
  icon?: string;
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

export interface EvaluationData {
  overallScore: number;
  skills: Array<{ name: string; score: number }>;
  whatYouDidWell: string[];
  areasToImprove: string[];
  betterResponses: Array<{ type: string; text: string }>;
}

export interface SessionHistoryItem {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  skillId: string;
  skillName: string;
  difficulty: Difficulty;
  date: string;
  score: number;
  characterName: string;
  avatarUrl: string;
}

export interface SessionHistoryDetail {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  skillId: string;
  skillName: string;
  difficulty: Difficulty;
  date: string;
  messages: Message[];
  evaluation?: EvaluationData;
}

export interface UserProgressData {
  totalSessions: number;
  averageScore: number;
  streakDays: number;
  totalPracticeMinutes: number;
  skills: Skill[];
  recentActivity: Array<{
    sessionId: string;
    title: string;
    score: number;
    date: string;
  }>;
}

export const defaultUser: User = {
  id: 'usr_123',
  name: 'Chaitanya',
  email: 'chaitanya@example.com'
};

export const skills: Skill[] = [
  { 
    id: 'communication', 
    name: 'Communication', 
    score: 80, 
    description: 'Practice expressing your thoughts clearly and persuasively',
    icon: 'message-circle'
  },
  { 
    id: 'confidence', 
    name: 'Confidence', 
    score: 70, 
    description: 'Practice speaking with assurance, presence, and conviction',
    icon: 'mic'
  },
  { 
    id: 'active-listening', 
    name: 'Active Listening', 
    score: 60, 
    description: 'Understand nuances, validate feelings, and respond thoughtfully',
    icon: 'ear'
  },
  { 
    id: 'small-talk', 
    name: 'Small Talk', 
    score: 90, 
    description: 'Navigate casual social interactions and build effortless rapport',
    icon: 'users'
  },
  { 
    id: 'conflict', 
    name: 'Conflict Handling', 
    score: 55, 
    description: 'De-escalate tension, resolve disagreements, and find common ground',
    icon: 'shield-alert'
  }
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
  },
  {
    id: 'active-listening-friend',
    skillId: 'active-listening',
    title: 'Supporting a Stressed Colleague',
    description: 'A teammate is overwhelmed with their current workload and opens up to you. Listen and support them without being dismissive.',
    characterName: 'Elena',
    characterRole: 'Software Engineer',
    characterStatus: 'Online',
    characterTags: ['Vulnerable', 'Overworked', 'Appreciative'],
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Elena&backgroundColor=ffd5dc'
  },
  {
    id: 'clear-presentation',
    skillId: 'communication',
    title: 'Project Pitch to Stakeholders',
    description: 'Present an innovative new feature proposal to a skeptical project lead and clearly articulate its benefits.',
    characterName: 'Marcus',
    characterRole: 'Product Director',
    characterStatus: 'Online',
    characterTags: ['Analytical', 'Direct', 'Results-Oriented'],
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus&backgroundColor=d1d4f9'
  }
];

export const recentSessions: SessionHistoryItem[] = [
  { 
    id: '1', 
    scenarioId: 'small-talk-coffee',
    scenarioTitle: 'Coffee Shop Chat', 
    skillId: 'small-talk',
    skillName: 'Small Talk',
    difficulty: 'easy',
    date: '2 hours ago', 
    score: 8.5,
    characterName: 'Barista Sam',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam&backgroundColor=b6e3f4'
  },
  { 
    id: '2', 
    scenarioId: 'networking-event',
    scenarioTitle: 'Networking Event Mixer', 
    skillId: 'small-talk',
    skillName: 'Small Talk',
    difficulty: 'medium',
    date: 'Yesterday', 
    score: 7.2,
    characterName: 'Alex',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=b6e3f4'
  },
  { 
    id: '3', 
    scenarioId: 'salary-negotiation',
    scenarioTitle: 'Job Interview Prep', 
    skillId: 'confidence',
    skillName: 'Confidence',
    difficulty: 'hard',
    date: '3 days ago', 
    score: 9.0,
    characterName: 'Sarah',
    avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=ffdfbf'
  }
];
