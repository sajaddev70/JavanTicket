import { create } from 'zustand';

export interface AdminUser {
  id: number;
  mobile: string;
  fullName: string;
  email?: string;
  userType: string;
  roles: string[];
  permissions: string[];
}

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  /** True once the persisted session has been read from localStorage. */
  hydrated: boolean;
  setAuth: (user: AdminUser, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  setAuth: (user, token) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ user: null, token: null });
  },
  initialize: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr), hydrated: true });
        return;
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    set({ hydrated: true });
  },
}));
