/** Signed-in user (auth response and GET /user/profile). */

export interface AuthUser {
  id: number;
  mobile: string;
  fullName?: string | null;
  email?: string | null;
  userType: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface UserProfile {
  id: number;
  mobile: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  orders_count: number;
  upcoming_tickets_count: number;
  favorites_count: number;
}

export interface ProfileInput {
  first_name: string;
  last_name: string;
  email?: string | null;
  city_id?: number | null;
}
