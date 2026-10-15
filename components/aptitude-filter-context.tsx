"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AptitudeFilterContextType = {
  showAptitude: boolean;
  setShowAptitude: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleAptitude: () => void;
};

const AptitudeFilterContext = createContext<AptitudeFilterContextType | null>(null);

const STORAGE_KEY = "adarsh_show_aptitude";

export function AptitudeFilterProvider({ children }: { children: React.ReactNode }) {
  // Default to false: technicals only initially, until user toggles General Aptitude ON
  const [showAptitude, setShowAptitudeState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setShowAptitudeState(stored === "true");
      }
    } catch {
      // ignore localStorage errors in private browsing or iframe
    }
  }, []);

  const setShowAptitude = (val: boolean | ((prev: boolean) => boolean)) => {
    setShowAptitudeState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleAptitude = () => {
    setShowAptitude((prev) => !prev);
  };

  return (
    <AptitudeFilterContext.Provider value={{ showAptitude, setShowAptitude, toggleAptitude }}>
      {children}
    </AptitudeFilterContext.Provider>
  );
}

export function useAptitudeFilter() {
  const ctx = useContext(AptitudeFilterContext);
  if (!ctx) {
    throw new Error("useAptitudeFilter must be used within an AptitudeFilterProvider");
  }
  return ctx;
}
