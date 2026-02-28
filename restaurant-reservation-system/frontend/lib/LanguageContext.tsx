"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, t, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("resres-lang") as Language | null;
    if (saved && ["en", "az", "ru", "es", "it", "ko"].includes(saved)) {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("resres-lang", newLang);
  };

  const translate = (key: TranslationKey) => t(key, lang);

  // Prevent hydration mismatch by rendering children only after mount
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: "en", setLang, t: (key) => t(key, "en") }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
