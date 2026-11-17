"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

type DsaFilterContextType = {
  showDsa: boolean;
  toggleDsa: () => void;
};

const DsaFilterContext = createContext<DsaFilterContextType | null>(null);
const STORAGE_KEY = "adarsh_show_dsa";
const CHANGE_EVENT = "adarsh_dsa_filter_change";
let storageFallback: boolean | undefined;

function getSnapshot(): boolean {
  if (storageFallback !== undefined) return storageFallback;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function toggleDsa() {
  const next = !getSnapshot();
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
    storageFallback = undefined;
  } catch {
    // Keep the toggle working when browser storage is unavailable.
    storageFallback = next;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function DsaFilterProvider({ children }: { children: React.ReactNode }) {
  const showDsa = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <DsaFilterContext.Provider value={{ showDsa, toggleDsa }}>
      {children}
    </DsaFilterContext.Provider>
  );
}

export function useDsaFilter() {
  const ctx = useContext(DsaFilterContext);
  if (!ctx) {
    throw new Error("useDsaFilter must be used within a DsaFilterProvider");
  }
  return ctx;
}
