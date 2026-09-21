import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { AppLanguage } from '../types';
import {
  SUPPORTED_LANGUAGES,
  LanguageMeta,
  translations
} from '../i18n/translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languages: LanguageMeta[];
  currentLanguageConfig: LanguageMeta;
  isRtl: boolean;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const STORAGE_KEY = 'taskflow_app_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as AppLanguage;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    // Fallback to browser language if supported
    const browserLang = navigator.language?.slice(0, 2)?.toLowerCase();
    const matched = SUPPORTED_LANGUAGES.find((l) => l.code === browserLang);
    if (matched) return matched.code;
  } catch {
    // Ignore localStorage access errors
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  const currentLanguageConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const isRtl = currentLanguageConfig.dir === 'rtl';

  // Apply language and text direction to HTML document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      if (isRtl) {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [language, isRtl]);

  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  // Translation resolver with nested key support and parameter interpolation
  const t = useCallback(
    (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string): string => {
      let defaultFallback = typeof paramsOrFallback === 'string' ? paramsOrFallback : fallback || key;
      const params = typeof paramsOrFallback === 'object' ? paramsOrFallback : undefined;

      const keys = key.split('.');
      
      // Look up in current language dictionary
      let currentObj: any = translations[language];
      for (const k of keys) {
        if (currentObj && typeof currentObj === 'object' && k in currentObj) {
          currentObj = currentObj[k];
        } else {
          currentObj = undefined;
          break;
        }
      }

      // If not found, fall back to English
      if (currentObj === undefined || typeof currentObj !== 'string') {
        let enObj: any = translations.en;
        for (const k of keys) {
          if (enObj && typeof enObj === 'object' && k in enObj) {
            enObj = enObj[k];
          } else {
            enObj = undefined;
            break;
          }
        }
        if (typeof enObj === 'string') {
          currentObj = enObj;
        }
      }

      let result = typeof currentObj === 'string' ? currentObj : defaultFallback;

      // Handle simple interpolation: {param}
      if (params && typeof result === 'string') {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return result;
    },
    [language]
  );

  // Locale-aware date formatter
  const formatDate = useCallback(
    (dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return String(dateInput);

        const localeMap: Record<AppLanguage, string> = {
          en: 'en-US',
          es: 'es-ES',
          fr: 'fr-FR',
          de: 'de-DE',
          ja: 'ja-JP',
          zh: 'zh-CN',
          pt: 'pt-BR',
          ar: 'ar-SA'
        };

        const locale = localeMap[language] || 'en-US';
        const defaultOptions: Intl.DateTimeFormatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };

        return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
      } catch {
        return String(dateInput);
      }
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageConfig,
      isRtl,
      t,
      formatDate
    }),
    [language, setLanguage, currentLanguageConfig, isRtl, t, formatDate]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
