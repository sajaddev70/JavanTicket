import { http } from "./api";
import { getHoldToken } from "@/stores/holdToken";
import type { SeatMapData } from "@/types/event";

export const sessionService = {
  /** Seat map of a session; seats held by this browser come back as SELECTED, with the hold's remaining time. */
  seatMap: (sessionId: number) =>
    http.get<SeatMapData>(`/public/sessions/${sessionId}/seat-map`, undefined, { headers: { "X-Hold-Token": getHoldToken() } }),
};
