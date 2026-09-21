import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AppLanguage } from '../types';

interface LanguageSwitcherProps {
  variant?: 'header' | 'dropdown' | 'compact' | 'full' | 'login';
  className?: string;
  onLanguageSelected?: () => void;
  id?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
  onLanguageSelected,
  id = 'btn-language-switcher'
}) => {
  const { language, setLanguage, languages, currentLanguageConfig } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (langCode: AppLanguage) => {
    setLanguage(langCode);
    setIsOpen(false);
    onLanguageSelected?.();
  };

  if (variant === 'full') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
        {languages.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              type="button"
              id={`lang-select-${lang.code}`}
              onClick={() => handleSelectLanguage(lang.code)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-xs'
                  : 'bg-[#181818] border-[#2a2a2a] text-neutral-300 hover:border-[#383838] hover:bg-[#202020]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0 select-none" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-white truncate">
                      {lang.nativeName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono uppercase bg-[#262626] px-1.5 py-0.2 rounded">
                      {lang.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {lang.name} • {lang.region}
                  </p>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-neutral-700 group-hover:border-neutral-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {variant === 'login' ? (
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          title={`Change language (${currentLanguageConfig.name})`}
          aria-label="Change language"
          className={`h-9 px-3 rounded-xl flex items-center gap-2 border text-xs font-semibold transition-all cursor-pointer active:scale-95 group shadow-lg backdrop-blur-md ${
            isOpen
              ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-blue-500/10'
              : 'bg-[#161616]/90 hover:bg-[#202020] text-neutral-200 hover:text-white border-[#2e2e2e] hover:border-[#3e3e3e]'
          }`}
        >
          <Globe className={`w-3.5 h-3.5 text-blue-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : 'group-hover:rotate-12'}`} />
          <span className="text-base select-none shrink-0">{currentLanguageConfig.flag}</span>
          <span className="font-semibold text-white tracking-normal">
            {currentLanguageConfig.nativeName}
          </span>
          <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          title={`Change language (${currentLanguageConfig.name})`}
          aria-label="Change language"
          className={`h-8 px-2 sm:px-2.5 rounded flex items-center gap-1.5 border text-xs font-medium transition-all cursor-pointer active:scale-95 group ${
            isOpen
              ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-xs'
              : 'bg-[#1a1a1a] hover:bg-[#262626] text-neutral-200 hover:text-white border-[#333333]'
          }`}
        >
          <Globe className={`w-3.5 h-3.5 text-blue-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : 'group-hover:rotate-12'}`} />
          <span className="text-sm select-none shrink-0">{currentLanguageConfig.flag}</span>
          <span className="text-xs font-semibold uppercase tracking-wider hidden xs:inline text-neutral-200">
            {currentLanguageConfig.code}
          </span>
          <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
        </button>
      )}

      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:top-full sm:right-0 mt-2 w-auto sm:w-64 bg-[#181818] rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto">
          <div className="px-3 py-2 border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-bold text-white tracking-tight">Select Language</span>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
              {languages.length} Locales
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`dropdown-lang-item-${lang.code}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-600/20 text-white font-semibold'
                      : 'text-neutral-300 hover:bg-[#242424] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base select-none shrink-0" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{lang.nativeName}</span>
                        {lang.dir === 'rtl' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            RTL
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate">{lang.name}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
