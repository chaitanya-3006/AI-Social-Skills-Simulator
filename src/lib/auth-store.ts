import { create } from 'zustand';
import { User, LoginRequest, RegisterRequest } from './mock-data';
import { api } from './api';

const TOKEN_KEY = 'socialsim_auth_token';
const USER_KEY = 'socialsim_active_user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  clearError: () => void;
}

// Initial state reading from storage
const getInitialState = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (token && userJson) {
      const user = JSON.parse(userJson);
      return {
        token,
        user,
        isAuthenticated: true,
      };
    }
  } catch (e) {
    console.error('Failed reading auth state from localStorage', e);
  }
  return {
    token: null,
    user: null,
    isAuthenticated: false,
  };
};

const initial = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: initial.isAuthenticated,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.login(credentials);
      set({
        token: res.access_token,
        user: res.user || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || 'Login failed',
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await api.register(data);
      // Auto-login after registration
      const loginRes = await api.login({ email: data.email, password: data.password });
      set({
        token: loginRes.access_token,
        user: loginRes.user || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || 'Registration failed',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error(e);
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  initAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      const user = await api.getMe(token);
      set({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (e) {
      console.error('Session expired or invalid', e);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
