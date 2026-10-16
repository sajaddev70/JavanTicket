import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards; for values that depend on the browser (clock, storage). */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Reads a sessionStorage key without a setState-in-effect round trip. */
export function useSessionValue(key: string): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => sessionStorage.getItem(key),
    () => undefined,
  );
}
