import { 
  Skill, 
  Message, 
  skills, 
  recentSessions, 
  User, 
  RegisterRequest, 
  RegisterResponse, 
  LoginRequest, 
  LoginResponse,
  defaultUser 
} from './mock-data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple mock user database stored in localStorage for stateful auth testing
const USERS_STORAGE_KEY = 'socialsim_mock_users';
const ACTIVE_USER_KEY = 'socialsim_active_user';
const TOKEN_KEY = 'socialsim_auth_token';

interface StoredUser extends User {
  passwordHash: string;
}

const getStoredUsers = (): StoredUser[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse users from localStorage', e);
  }
  return [
    { ...defaultUser, passwordHash: 'password' }
  ];
};

const saveStoredUsers = (users: StoredUser[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage', e);
  }
};

export const api = {
  // ==========================================
  // Authentication APIs
  // ==========================================

  /**
   * POST /api/auth/register
   * Creates a new user account.
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    await delay(700);

    if (!data.name || !data.email || !data.password) {
      throw new Error('Name, email, and password are required.');
    }

    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.password
    };

    users.push(newUser);
    saveStoredUsers(users);

    return {
      user_id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };
  },

  /**
   * POST /api/auth/login
   * Authenticates the user and returns a JWT access token.
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await delay(700);

    if (!data.email || !data.password) {
      throw new Error('Email and password are required.');
    }

    const users = getStoredUsers();
    const user = users.find(
      u => u.email.toLowerCase() === data.email.toLowerCase() && u.passwordHash === data.password
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Generate simulated JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    }));
    const signature = btoa(`sig_${Date.now()}`);
    const token = `${header}.${payload}.${signature}`;

    const { passwordHash: _, ...safeUser } = user;

    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(safeUser));
    } catch (e) {
      console.error(e);
    }

    return {
      access_token: token,
      token_type: 'bearer',
      user: safeUser
    };
  },

  /**
   * GET /api/auth/me
   * Gets the currently authenticated user.
   */
  getMe: async (token?: string): Promise<User> => {
    await delay(400);

    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    if (!activeToken) {
      throw new Error('Unauthorized: No authentication token found.');
    }

    try {
      const stored = localStorage.getItem(ACTIVE_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // Fallback to default user if token exists
    return defaultUser;
  },

  // ==========================================
  // Skills APIs
  // ==========================================

  /**
   * GET /api/skills
   * Returns list of available social skills.
   */
  getSkills: async (): Promise<Skill[]> => {
    await delay(400);
    return skills;
  },

  /**
   * GET /api/skills/{skill_id}
   * Gets details about one specific skill.
   */
  getSkillById: async (skillId: string): Promise<Skill | null> => {
    await delay(300);
    const found = skills.find(s => s.id === skillId);
    return found || null;
  },

  // ==========================================
  // Simulation APIs
  // ==========================================

  startSimulation: async (_scenarioId: string, _difficulty: string) => {
    await delay(800);
    return {
      sessionId: `session_${Date.now()}`,
      status: 'started' as const
    };
  },

  sendMessage: async (_sessionId: string, message: string): Promise<Message> => {
    await delay(1200); // Simulate AI thinking time
    
    // Simple mock responses based on content and length of user message
    let responseText = "That's interesting, tell me more about your perspective.";
    const lower = message.toLowerCase();
    
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      responseText = "Hi there! It's great to connect with you. What brings you here today?";
    } else if (lower.includes('salary') || lower.includes('offer') || lower.includes('compensation')) {
      responseText = "I appreciate you bringing that up. We value your expertise, but our budget is tight. What range were you thinking?";
    } else if (lower.includes('project') || lower.includes('help') || lower.includes('deadline')) {
      responseText = "I hear your concern. I've been swamped with other coursework, but I really want us to succeed. Let's divide the remaining tasks.";
    } else if (message.length > 50) {
      responseText = "I see your point clearly. It's really fascinating how that works out in practice. How do you propose we move forward with this?";
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'ai',
      content: responseText,
      timestamp: new Date().toISOString()
    };
  },

  endSimulation: async (_sessionId: string) => {
    await delay(1000);
    return { success: true };
  },

  getEvaluation: async (_sessionId: string) => {
    await delay(1500);
    return {
      overallScore: 8.2,
      skills: [
        { name: 'Communication', score: 8.5 },
        { name: 'Confidence', score: 7.5 },
        { name: 'Active Listening', score: 9.0 },
        { name: 'Empathy', score: 8.0 }
      ],
      whatYouDidWell: [
        "Asked insightful open-ended questions that deepened the dialogue",
        "Maintained a calm, empathetic, and constructive tone throughout",
        "Demonstrated active listening by validating the other person's perspective"
      ],
      areasToImprove: [
        "Try to structure key proposals more concisely before providing elaboration",
        "Take a brief deliberate pause before answering complex questions"
      ],
      betterResponses: [
        {
          type: "Casual",
          text: "I completely see where you're coming from! Let's figure out a quick win together."
        },
        {
          type: "Confident",
          text: "Based on my market research and contributions, I'm confident that a 15% adjustment aligns with industry benchmarks."
        },
        {
          type: "Friendly",
          text: "I'd love to understand your viewpoint better so we can make this work smoothly for everyone."
        }
      ]
    };
  },

  getHistory: async () => {
    await delay(500);
    return recentSessions;
  },

  getProgress: async () => {
    await delay(500);
    return skills;
  }
};
