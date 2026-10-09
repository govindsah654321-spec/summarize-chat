import { LANGUAGES, useApp } from '@/context/AppContext';
import type { LanguageCode } from '@/types';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Globe className="w-4 h-4 text-slate-500" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          className="text-sm bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer hover:bg-slate-50 transition-colors"
          aria-label="Select language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-600">
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">Language / भाषा / भाषा</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
              language === lang.code
                ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200'
                : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
            }`}
          >
            <div className="text-base">{lang.nativeLabel}</div>
            <div className={`text-xs mt-0.5 ${language === lang.code ? 'text-sky-100' : 'text-slate-400'}`}>
              {lang.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
