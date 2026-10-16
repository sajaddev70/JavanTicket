import { isServer, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/api";

/** Retries only failures that may pass on a second try (network / 5xx), never 4xx answers. */
function retry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status && error.status < 500) return false;
  return failureCount < 2;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data rendered on the server is not fetched again right after hydration.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry,
      },
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/** A new client per server request; one shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  return (browserClient ??= makeQueryClient());
}
