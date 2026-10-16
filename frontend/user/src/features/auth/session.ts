/** Login hand-off between /login and /verify (this tab only). */
const MOBILE = "pending_user_mobile";
const NEXT = "login_next";

/** Internal path to return to after signing in; anything else (other sites, //host) falls back to "/". */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/verify") ? next : "/";
}

export const loginSession = {
  start(mobile: string, next: string) {
    try {
      sessionStorage.setItem(MOBILE, mobile);
      sessionStorage.setItem(NEXT, safeNext(next));
    } catch {}
  },
  mobile: () => {
    try {
      return sessionStorage.getItem(MOBILE);
    } catch {
      return null;
    }
  },
  next: () => {
    try {
      return safeNext(sessionStorage.getItem(NEXT));
    } catch {
      return "/";
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(MOBILE);
      sessionStorage.removeItem(NEXT);
    } catch {}
  },
};
