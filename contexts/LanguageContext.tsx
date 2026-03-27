"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type TranslationKey } from "@/lib/i18n/translations";

// Central contract exposed to any component that needs i18n.
// - `language`: current selected locale.
// - `setLanguage`: updates locale and persists it to localStorage.
// - `t`: resolves one translation key into localized text.
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default language during first client render.
  // This value can be overridden immediately after mount from localStorage.
  const [language, setLanguageState] = useState<Language>("en");

  // Prevent rendering children until we know whether a user language was saved.
  // This avoids a flash in English before switching to the saved locale.
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("insurevision-language") as Language | null;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Persist per-browser preference (frontend only, no API/database call).
    localStorage.setItem("insurevision-language", lang);
  };

  // Translation function
  const t = (key: TranslationKey): string => {
    // Fallback chain:
    // 1) currently selected language
    // 2) English baseline
    // 3) key itself, to make missing entries obvious during development
    return translations[language][key] || translations.en[key] || key;
  };

  // Prevent flash of wrong language
  if (!mounted) {
    return null;
  }

  return (
    // One provider value shared by all wrapped dashboard pages/components.
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Guard against usage outside provider tree.
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
