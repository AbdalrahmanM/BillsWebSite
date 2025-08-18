import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'en' | 'ar';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('lang') as Lang) === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    // Persist and reflect to document attributes
    try { localStorage.setItem('lang', lang); } catch {}
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    } catch {}
  }, [lang]);

  const value = useMemo<LanguageContextValue>(() => ({
    lang,
    setLang,
    toggleLang: () => setLang((prev) => (prev === 'en' ? 'ar' : 'en')),
  }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
  {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export default LanguageProvider;
