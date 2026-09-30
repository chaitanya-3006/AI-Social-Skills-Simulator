import { 
  Skill, 
  Scenario,
  Message, 
  skills as mockSkills, 
  scenarios as mockScenarios,
  recentSessions, 
  User, 
  RegisterRequest, 
  RegisterResponse, 
  LoginRequest, 
  LoginResponse,
  defaultUser,
  SessionHistoryItem,
  SessionHistoryDetail,
  UserProgressData,
  EvaluationData
} from './mock-data';

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
  // 1. Authentication APIs
  // ==========================================

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
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.warn('FastAPI backend not reachable, using local fallback.');
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
      
      if (res.access_token) {
        localStorage.setItem(TOKEN_KEY, res.access_token);
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
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        console.warn('FastAPI backend not reachable, using local fallback.');
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
      const stored = localStorage.getItem('socialsim_active_user');
      if (stored) return JSON.parse(stored);
      return defaultUser;
    }
  },

  // ==========================================
  // 2. Skills APIs
  // ==========================================

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
      return mockSkills;
    }
  },

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
  // 3. Scenarios APIs
  // ==========================================

  getScenarios: async (skillId?: string): Promise<Scenario[]> => {
    try {
      const url = skillId 
        ? `${API_BASE_URL}/api/scenarios?skill_id=${encodeURIComponent(skillId)}`
        : `${API_BASE_URL}/api/scenarios`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data = await response.json();
      
      // Transform snake_case response to camelCase frontend model
      return data.map((d: any) => ({
        id: d.id,
        skillId: d.skill_id,
        title: d.title,
        description: d.description,
        characterName: d.character_name,
        characterRole: d.character_role,
        characterStatus: d.character_status,
        characterTags: d.character_tags,
        avatarUrl: d.avatar_url
      }));
    } catch (e) {
      if (skillId) {
        return mockScenarios.filter(s => s.skillId === skillId);
      }
      return mockScenarios;
    }
  },

  getScenarioById: async (scenarioId: string): Promise<Scenario | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenarios/${scenarioId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) return null;
      const d = await response.json();
      return {
        id: d.id,
        skillId: d.skill_id,
        title: d.title,
        description: d.description,
        characterName: d.character_name,
        characterRole: d.character_role,
        characterStatus: d.character_status,
        characterTags: d.character_tags,
        avatarUrl: d.avatar_url
      };
    } catch (e) {
      const found = mockScenarios.find(s => s.id === scenarioId);
      return found || null;
    }
  },

  // ==========================================
  // 4. Live Simulation & Chat APIs
  // ==========================================

  startSimulation: async (scenarioId: string, difficulty: string): Promise<{ sessionId: string; status: string; initialMessage?: Message }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/simulation/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ scenario_id: scenarioId, difficulty })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          sessionId: data.session_id,
          status: data.status,
          initialMessage: data.initial_message
        };
      }
    } catch (e) {
      console.warn('Backend startSimulation fallback');
    }

    await delay(600);
    return {
      sessionId: `session_${Date.now()}`,
      status: 'started'
    };
  },

  sendMessage: async (sessionId: string, message: string): Promise<Message> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionId, message })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend chat fallback');
    }

    await delay(1000);
    return {
      id: `msg_${Date.now()}`,
      role: 'ai',
      content: "I see your point clearly. How do you propose we move forward?",
      timestamp: new Date().toISOString()
    };
  },

  endSimulation: async (sessionId: string): Promise<{ success: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/simulation/end`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ session_id: sessionId })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend endSimulation fallback');
    }

    await delay(600);
    return { success: true };
  },

  getEvaluation: async (sessionId: string): Promise<EvaluationData> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/evaluation/${sessionId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return {
          overallScore: data.overall_score,
          skills: data.skills,
          whatYouDidWell: data.what_you_did_well,
          areasToImprove: data.areas_to_improve,
          betterResponses: data.better_responses
        };
      }
    } catch (e) {
      console.warn('Backend getEvaluation fallback');
    }

    await delay(1000);
    return {
      overallScore: 8.4,
      skills: [
        { name: 'Communication', score: 8.5 },
        { name: 'Confidence', score: 8.0 },
        { name: 'Active Listening', score: 9.0 },
        { name: 'Empathy', score: 8.2 }
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
        { type: "Casual", text: "I completely see where you're coming from! Let's figure out a quick win together." },
        { type: "Confident", text: "Based on my market research and contributions, I'm confident in this proposal." },
        { type: "Friendly", text: "I'd love to understand your viewpoint better so we can make this work smoothly." }
      ]
    };
  },

  // ==========================================
  // 5. History & Progress APIs
  // ==========================================

  getHistory: async (): Promise<SessionHistoryItem[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return data.map((d: any) => ({
          id: d.id,
          scenarioId: d.scenario_id,
          scenarioTitle: d.scenario_title,
          skillId: d.skill_id,
          skillName: d.skill_name,
          difficulty: d.difficulty,
          date: d.date,
          score: d.score,
          characterName: d.character_name,
          avatarUrl: d.avatar_url
        }));
      }
    } catch (e) {
      console.warn('Backend getHistory fallback');
    }

    return recentSessions;
  },

  getHistoryDetail: async (sessionId: string): Promise<SessionHistoryDetail | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history/${sessionId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const d = await response.json();
        return {
          id: d.id,
          scenarioId: d.scenario_id,
          scenarioTitle: d.scenario_title,
          skillId: d.skill_id,
          skillName: d.skill_name,
          difficulty: d.difficulty,
          date: d.date,
          messages: d.messages,
          evaluation: d.evaluation ? {
            overallScore: d.evaluation.overall_score,
            skills: d.evaluation.skills,
            whatYouDidWell: d.evaluation.what_you_did_well,
            areasToImprove: d.evaluation.areas_to_improve,
            betterResponses: d.evaluation.better_responses
          } : undefined
        };
      }
    } catch (e) {
      console.warn('Backend getHistoryDetail fallback');
    }
    return null;
  },

  getProgress: async (): Promise<UserProgressData> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/progress`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const d = await response.json();
        return {
          totalSessions: d.total_sessions,
          averageScore: d.average_score,
          streakDays: d.streak_days,
          totalPracticeMinutes: d.total_practice_minutes,
          skills: d.skills,
          recentActivity: d.recent_activity.map((r: any) => ({
            sessionId: r.session_id,
            title: r.title,
            score: r.score,
            date: r.date
          }))
        };
      }
    } catch (e) {
      console.warn('Backend getProgress fallback');
    }

    return {
      totalSessions: 3,
      averageScore: 8.2,
      streakDays: 4,
      totalPracticeMinutes: 45,
      skills: mockSkills,
      recentActivity: recentSessions.map(s => ({
        sessionId: s.id,
        title: s.scenarioTitle,
        score: s.score,
        date: s.date
      }))
    };
  }
};
