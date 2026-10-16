"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClient";
import { hydrateAuth, useAuthStore } from "@/stores/useAuthStore";
import { CityProvider } from "./CityProvider";
import { Toaster } from "@/components/feedback/Toaster";

export default function AppProviders({ initialCityId, children }: { initialCityId: number | null; children: React.ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => hydrateAuth(), []);

  // Signing out drops every cached user query (orders, tickets, profile...).
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (previous.token && !state.token) {
          queryClient.removeQueries({ queryKey: ["orders"] });
          queryClient.removeQueries({ queryKey: ["order"] });
          queryClient.removeQueries({ queryKey: ["tickets"] });
          queryClient.removeQueries({ queryKey: ["ticket"] });
          queryClient.removeQueries({ queryKey: ["profile"] });
          queryClient.removeQueries({ queryKey: ["favorites"] });
          queryClient.removeQueries({ queryKey: ["payment"] });
        }
      }),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CityProvider initialCityId={initialCityId}>
        {children}
        <Toaster />
      </CityProvider>
    </QueryClientProvider>
  );
}
