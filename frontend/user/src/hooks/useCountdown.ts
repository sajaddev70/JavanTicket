import { useEffect, useState } from "react";

/**
 * Seconds remaining until a server deadline. The backend reports `seconds_left` by its own clock; the deadline is
 * anchored to the moment that answer arrived ([receivedAt]), so a wrong device clock cannot change the countdown.
 */
export function useCountdown(secondsLeft: number | null | undefined, receivedAt: number): number | null {
  const [now, setNow] = useState(() => Date.now());
  const active = secondsLeft !== null && secondsLeft !== undefined;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;
  // `now` may predate the answer (first render): elapsed time is never negative.
  return Math.max(0, Math.round(secondsLeft - Math.max(0, now - receivedAt) / 1000));
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
