import { useCallback, useState } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "@/services/session.service";
import { seatService } from "@/services/seat.service";
import { queryKeys } from "@/constants/queryKeys";
import { errorMessage, isStatus } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import type { Seat, SeatHold, SeatMapData, SeatStatus } from "@/types/event";

export const seatMapQuery = (sessionId: number) =>
  queryOptions({
    queryKey: queryKeys.seatMap(sessionId),
    queryFn: () => sessionService.seatMap(sessionId),
    staleTime: 0,
    // Other buyers pick seats too: keep the map fresh while the page is open.
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    retry: (n, err) => !isStatus(err, 404) && n < 2,
  });

export const useSeatMap = (sessionId: number) => useQuery(seatMapQuery(sessionId));

/**
 * Picking and releasing seats. Every pick is a lock on the server (POST /holds); only when it succeeds is the seat
 * shown as selected. A seat taken meanwhile by someone else answers 409: the message is shown and the map reloaded.
 */
export function useSeatLocks(sessionId: number) {
  const qc = useQueryClient();
  const key = queryKeys.seatMap(sessionId);
  const [pending, setPending] = useState<Set<number>>(new Set());

  const patch = useCallback(
    (seatIds: number[], status: SeatStatus, hold?: SeatHold) =>
      qc.setQueryData<SeatMapData>(key, (old) =>
        old
          ? {
              ...old,
              hold: hold ?? old.hold,
              seats: old.seats.map((s) => (seatIds.includes(s.id) ? { ...s, status } : s)),
            }
          : old,
      ),
    [qc, key],
  );

  const mark = (id: number, on: boolean) =>
    setPending((p) => {
      const next = new Set(p);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggle = useCallback(
    async (seat: Seat) => {
      mark(seat.id, true);
      try {
        if (seat.status === "SELECTED") {
          const hold = await seatService.release(sessionId, seat.id);
          patch([seat.id], "AVAILABLE", hold);
        } else {
          const hold = await seatService.lock(sessionId, seat.id);
          patch([seat.id], "SELECTED", hold);
        }
      } catch (error) {
        toast.error(errorMessage(error));
        if (isStatus(error, 409)) patch([seat.id], "LOCKED");
        qc.invalidateQueries({ queryKey: key });
      } finally {
        mark(seat.id, false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is derived from sessionId
    [sessionId, patch, qc],
  );

  const releaseAll = useCallback(async () => {
    try {
      await seatService.releaseAll(sessionId);
    } catch (error) {
      toast.error(errorMessage(error));
    }
    await qc.invalidateQueries({ queryKey: key });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is derived from sessionId
  }, [sessionId, qc]);

  return { toggle, releaseAll, pending };
}
