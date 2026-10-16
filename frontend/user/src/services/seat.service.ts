import { http } from "./api";
import { getHoldToken } from "@/stores/holdToken";
import type { SeatHold } from "@/types/event";

const headers = () => ({ headers: { "X-Hold-Token": getHoldToken() } });

/** Seat locks: a seat is reserved on the server the moment it is picked (10 minutes, shared by the selection). */
export const seatService = {
  holds: (sessionId: number) => http.get<SeatHold>(`/public/sessions/${sessionId}/holds`, undefined, headers()),
  lock: (sessionId: number, seatId: number) => http.post<SeatHold>(`/public/sessions/${sessionId}/holds`, { seat_id: seatId }, headers()),
  release: (sessionId: number, seatId: number) => http.delete<SeatHold>(`/public/sessions/${sessionId}/holds/${seatId}`, headers()),
  releaseAll: (sessionId: number) => http.delete<SeatHold>(`/public/sessions/${sessionId}/holds`, headers()),
};
