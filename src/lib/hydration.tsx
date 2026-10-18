"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
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

const noSubscribe = () => () => {};

/**
 * Suspense boundaries hydrate after the store may already be rehydrated, so the
 * context alone can read `true` during a boundary's hydration pass. The server
 * snapshot keeps that pass identical to the server HTML.
 */
export function useHydrated() {
  const storeReady = useContext(HydratedContext);
  const hydrating = useSyncExternalStore(noSubscribe, () => false, () => true);
  return storeReady && !hydrating;
}
