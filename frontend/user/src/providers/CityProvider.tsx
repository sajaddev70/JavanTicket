"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { writeCityCookie } from "@/lib/city";

interface CityContextValue {
  /** City picked in the header; null = all cities. Applied to every event list. */
  cityId: number | null;
  setCityId: (cityId: number | null) => void;
}

const CityContext = createContext<CityContextValue>({ cityId: null, setCityId: () => {} });

/** Starts from the city cookie read on the server, so server-rendered lists and the client agree. */
export function CityProvider({ initialCityId, children }: { initialCityId: number | null; children: React.ReactNode }) {
  const [cityId, setState] = useState(initialCityId);
  const setCityId = useCallback((next: number | null) => {
    writeCityCookie(next);
    setState(next);
  }, []);
  const value = useMemo(() => ({ cityId, setCityId }), [cityId, setCityId]);
  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export const useCity = () => useContext(CityContext);
