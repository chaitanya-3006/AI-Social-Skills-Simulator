import { 
  Skill, 
  Message, 
  skills as mockSkills, 
  recentSessions, 
  User, 
  RegisterRequest, 
  RegisterResponse, 
  LoginRequest, 
  LoginResponse,
  defaultUser 
} from './mock-data';

// Base URL for backend API (uses relative path to leverage Vite proxy, or direct API_URL env if provided)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';
const TOKEN_KEY = 'socialsim_auth_token';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // ==========================================
  // 1. Authentication APIs -> FastAPI
  // ==========================================

  /**
   * POST /api/auth/register
   * Sends user registration request to FastAPI backend.
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed.');
      }

      return await response.json();
    } catch (err: any) {
      // If server is not running, provide local fallback
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.warn('FastAPI backend not reachable, using local fallback for registration.');
        await delay(500);
        return {
          user_id: `usr_${Date.now()}`,
          name: data.name,
          email: data.email
        };
      }
      throw err;
    }
  },

  /**
   * POST /api/auth/login
   * Sends user login request to FastAPI backend and receives JWT access token.
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid email or password.');
      }

      const res: LoginResponse = await response.json();
      
      // Store token
      if (res.access_token) {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        // Fetch and cache user profile
        try {
          const user = await api.getMe(res.access_token);
          res.user = user;
          localStorage.setItem('socialsim_active_user', JSON.stringify(user));
        } catch {
          res.user = {
            id: 'usr_123',
            name: data.email.split('@')[0],
            email: data.email
          };
        }
      }

      return res;
    } catch (err: any) {
      // Local fallback if server is offline
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.warn('FastAPI backend not reachable, using local fallback for login.');
        await delay(500);
        const fallbackUser: User = {
          id: 'usr_123',
          name: data.email.split('@')[0],
          email: data.email
        };
        const fallbackToken = `mock_jwt_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, fallbackToken);
        localStorage.setItem('socialsim_active_user', JSON.stringify(fallbackUser));
        return {
          access_token: fallbackToken,
          token_type: 'bearer',
          user: fallbackUser
        };
      }
      throw err;
    }
  },

  /**
   * GET /api/auth/me
   * Fetches currently logged-in user profile from FastAPI using JWT Bearer token.
   */
  getMe: async (token?: string): Promise<User> => {
    try {
      const headers = token 
        ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        : getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Unauthorized or session expired.');
      }

      const user: User = await response.json();
      localStorage.setItem('socialsim_active_user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      // Local fallback
      const stored = localStorage.getItem('socialsim_active_user');
      if (stored) return JSON.parse(stored);
      return defaultUser;
    }
  },

  // ==========================================
  // 2. Skills APIs -> FastAPI
  // ==========================================

  /**
   * GET /api/skills
   * Fetches available social skills from FastAPI backend.
   */
  getSkills: async (): Promise<Skill[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch skills from server.');
      }

      return await response.json();
    } catch (err: any) {
      console.warn('FastAPI backend not reachable, using cached skills.');
      return mockSkills;
    }
  },

  /**
   * GET /api/skills/{skill_id}
   * Fetches single skill details by ID from FastAPI backend.
   */
  getSkillById: async (skillId: string): Promise<Skill | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/skills/${skillId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to load skill.');

      return await response.json();
    } catch (err) {
      const found = mockSkills.find(s => s.id === skillId);
      return found || null;
    }
  },

  // ==========================================
  // 3. Simulation APIs
  // ==========================================

  startSimulation: async (_scenarioId: string, _difficulty: string) => {
    await delay(800);
    return {
      sessionId: `session_${Date.now()}`,
      status: 'started' as const
    };
  },

  sendMessage: async (_sessionId: string, message: string): Promise<Message> => {
    await delay(1200);
    
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
    return mockSkills;
  }
};
