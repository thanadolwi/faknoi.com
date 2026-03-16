"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "th" | "en" | "zh" | "hi";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: "th", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("faknoi_lang") as Lang | null;
    if (saved && ["th", "en", "zh", "hi"].includes(saved)) setLangState(saved);

    // Listen for changes from other tabs / pages
    function onStorage(e: StorageEvent) {
      if (e.key === "faknoi_lang" && e.newValue) {
        setLangState(e.newValue as Lang);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("faknoi_lang", l);
    // Dispatch storage event so same-tab listeners also update
    window.dispatchEvent(new StorageEvent("storage", { key: "faknoi_lang", newValue: l }));
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
