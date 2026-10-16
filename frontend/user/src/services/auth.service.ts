import { http } from "./api";
import type { AuthResponse } from "@/types/user";

/** User OTP sign-in (separate from the admin panel's OTP). The code is checked by the backend only. */
export const authService = {
  sendOtp: (mobile: string) => http.post<void>("/auth/user/login", { mobile }),
  verifyOtp: (mobile: string, code: string) => http.post<AuthResponse>("/auth/user/verify", { mobile, code }),
};
