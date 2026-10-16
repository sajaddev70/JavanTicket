import type { AuthUser } from "@/types/user";

/**
 * Persistence of the user session. The backend issues a bearer JWT (no cookies), kept in localStorage and sent in
 * the Authorization header (renewed with the refresh token, see services/api.ts); useAuthStore mirrors it for React. Listeners are notified on change
 * (also across tabs through the storage event).
 */
const TOKEN_KEY = "user_token";
const USER_KEY = "user_info";
const REFRESH_KEY = "user_refresh_token";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((l) => l());
}

export const authStorage = {
  token: () => read(TOKEN_KEY),

  user(): AuthUser | null {
    const raw = read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  refreshToken: () => read(REFRESH_KEY),

  signIn(token: string, user: AuthUser, refreshToken?: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch {
      // Private mode without storage: the session lasts for this page only.
    }
    notify();
  },

  updateUser(user: AuthUser) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
    notify();
  },

  signOut() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {}
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY || e.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};
