"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSalonStore } from "./store";

const HydratedContext = createContext(false);

/**
 * Rehydrates the persisted store after mount. The server render and the
 * first client render both use the seed, so there is no markup mismatch;
 * saved changes replace the seed a frame later.
 */
export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useSalonStore.persist.onFinishHydration(() => setHydrated(true));
    void useSalonStore.persist.rehydrate();
    return unsub;
  }, []);

  return <HydratedContext.Provider value={hydrated}>{children}</HydratedContext.Provider>;
}

export const useHydrated = () => useContext(HydratedContext);
