'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useUserAuthStore } from '@/stores/useUserAuthStore';
import { restoreCity } from '@/stores/useCityStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const initialize = useUserAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
    restoreCity();
    useFavoritesStore.getState().load();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
