import { create } from "zustand";
import { authStorage } from "./authStorage";
import type { AuthUser } from "@/types/user";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** False until the session has been read from storage (always false while rendering on the server). */
  hydrated: boolean;
  signIn: (token: string, user: AuthUser, refreshToken?: string) => void;
  updateUser: (user: AuthUser) => void;
  signOut: () => void;
}

function snapshot() {
  const token = authStorage.token();
  return { token, user: token ? authStorage.user() : null, isAuthenticated: !!token };
}

export const useAuthStore = create<AuthState>(() => ({
  token: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,
  signIn: (token, user, refreshToken) => authStorage.signIn(token, user, refreshToken),
  updateUser: (user) => authStorage.updateUser(user),
  signOut: () => authStorage.signOut(),
}));

/** Reads the stored session and keeps the store in sync with sign-in / sign-out (also from other tabs). */
export function hydrateAuth(): () => void {
  useAuthStore.setState({ ...snapshot(), hydrated: true });
  return authStorage.subscribe(() => useAuthStore.setState(snapshot()));
}
