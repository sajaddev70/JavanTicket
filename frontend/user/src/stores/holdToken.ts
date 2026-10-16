/**
 * Random id of this browser's seat selection (sent as X-Hold-Token). Seats are locked on the server for this id
 * before the buyer signs in; checkout turns them into the signed-in user's order.
 */
const KEY = "seat_hold_token";
let memory: string | null = null;

function newToken(): string {
  // randomUUID needs a secure context (https or localhost); getRandomValues works everywhere.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getHoldToken(): string {
  if (memory) return memory;
  try {
    memory = localStorage.getItem(KEY);
    if (!memory) {
      memory = newToken();
      localStorage.setItem(KEY, memory);
    }
  } catch {
    memory ??= newToken();
  }
  return memory;
}
