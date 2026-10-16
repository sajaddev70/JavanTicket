import { http } from "./api";
import type { PublicEvent } from "@/types/event";
import type { ProfileInput, UserProfile } from "@/types/user";

export const profileService = {
  get: () => http.get<UserProfile>("/user/profile"),
  update: (input: ProfileInput) => http.put<UserProfile>("/user/profile", input),
  favorites: () => http.get<PublicEvent[]>("/user/favorites"),
  favoriteIds: () => http.get<number[]>("/user/favorites/ids"),
  addFavorite: (eventId: number) => http.put<void>(`/user/favorites/${eventId}`),
  removeFavorite: (eventId: number) => http.delete<void>(`/user/favorites/${eventId}`),
};
