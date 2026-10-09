import type { ReactNode } from 'react';
import { useApp, LANGUAGES } from '@/context/AppContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  GraduationCap,
  Settings,
  Shield,
  Globe,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { Page } from '@/types';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS: { page: Page; icon: typeof LayoutDashboard; key: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { page: 'conversations', icon: MessageSquare, key: 'nav.conversations' },
  { page: 'aibuddy', icon: Bot, key: 'nav.aibuddy' },
  { page: 'studentlife', icon: GraduationCap, key: 'nav.studentlife' },
  { page: 'settings', icon: Settings, key: 'nav.settings' },
  { page: 'privacy', icon: Shield, key: 'nav.privacy' },
];

export function Layout({ children }: LayoutProps) {
  const { t, currentPage, setCurrentPage, language, setLanguage, settings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-30">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">CatchUp AI</h1>
              <p className="text-xs text-slate-400">{t('app.tagline').slice(0, 24)}...</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                {t(item.key)}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Language</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeLabel} ({lang.label})
              </option>
            ))}
          </select>
          {settings.studentMode && (
            <div className="mt-3 px-3 py-2 bg-amber-50 rounded-lg flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">{t('student.enabled')}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800">CatchUp AI</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeLabel}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="px-3 pb-3 space-y-1 bg-white">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-sky-500' : 'text-slate-400'}`} />
                  {t(item.key)}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
