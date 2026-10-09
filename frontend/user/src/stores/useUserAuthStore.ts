import { create } from 'zustand';

export interface UserProfile {
  id: number;
  mobile: string;
  fullName: string;
  email?: string;
  userType: string;
}

interface UserAuthState {
  user: UserProfile | null;
  token: string | null;
  /** True once the persisted session has been read from localStorage. */
  hydrated: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useUserAuthStore = create<UserAuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  setAuth: (user, token) => {
    localStorage.setItem('user_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    set({ user: null, token: null });
  },
  initialize: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('user_token');
    const userStr = localStorage.getItem('user_info');
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr), hydrated: true });
        return;
      } catch {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
      }
    }
    set({ hydrated: true });
  },
}));
