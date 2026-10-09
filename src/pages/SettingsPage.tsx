import { useApp } from '@/context/AppContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Settings as SettingsIcon,
  Globe,
  GraduationCap,
  Volume2,
  Shield,
  Database,
  Trash2,
  Info,
  Cloud,
  Accessibility,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  isSpeechSynthesisSupported,
  getAvailableVoices,
} from '@/utils/voice';
import { getVoicesForLang } from '@/i18n/voiceUtils';
import { useState, useEffect } from 'react';
import type { SpeechSynthesisVoice } from '@/types/speech';

export function SettingsPage() {
  const {
    t,
    settings,
    setSettings,
    clearBuddyHistory,
    clearAllConversations,
    resetAll,
    setCurrentPage,
  } = useApp();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const ssSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    if (!ssSupported) return;
    const load = () => setVoices(getAvailableVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [ssSupported]);

  const langVoices = getVoicesForLang(voices, settings.language);

  const handleResetAll = () => {
    if (confirm(t('settings.resetConfirm'))) {
      resetAll();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-slate-500" />
        {t('settings.title')}
      </h1>

      {/* Language */}
      <Section icon={<Globe className="w-5 h-5 text-sky-500" />} title={t('settings.language')} desc={t('settings.languageDesc')}>
        <LanguageSelector />
      </Section>

      {/* Student Mode */}
      <Section icon={<GraduationCap className="w-5 h-5 text-amber-500" />} title={t('settings.studentMode')} desc={t('settings.studentModeDesc')}>
        <button
          onClick={() => setSettings({ studentMode: !settings.studentMode })}
          className={`relative w-14 h-7 rounded-full transition-colors ${settings.studentMode ? 'bg-amber-500' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.studentMode ? 'left-8' : 'left-1'}`} />
        </button>
        <span className="text-sm text-slate-600 ml-3">
          {settings.studentMode ? t('common.on') : t('common.off')}
        </span>
      </Section>

      {/* Voice Settings */}
      <Section icon={<Volume2 className="w-5 h-5 text-purple-500" />} title={t('settings.voice')} desc={t('settings.voiceDesc')}>
        {!ssSupported ? (
          <p className="text-sm text-amber-600">{t('buddy.voiceNotSupported')}</p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => setSettings({ voiceEnabled: e.target.checked })}
                className="w-4 h-4 accent-sky-500"
              />
              <span className="text-sm text-slate-600">{t('settings.voiceEnabled')}</span>
            </label>

            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-24 flex-shrink-0">{t('settings.selectVoice')}</label>
              <select
                value={settings.voiceURI || ''}
                onChange={(e) => setSettings({ voiceURI: e.target.value })}
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {langVoices.length > 0 ? (
                  langVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                ) : (
                  <option value="">{t('buddy.noVoices')}</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 w-24 flex-shrink-0">{t('settings.speechRate')}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => setSettings({ speechRate: parseFloat(e.target.value) })}
                className="flex-1 accent-sky-500"
              />
              <span className="text-sm text-slate-500 w-10 text-right">{settings.speechRate.toFixed(1)}x</span>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.muted}
                onChange={(e) => setSettings({ muted: e.target.checked })}
                className="w-4 h-4 accent-sky-500"
              />
              <span className="text-sm text-slate-600">{t('settings.muted')}</span>
            </label>
          </div>
        )}
      </Section>

      {/* Accessibility */}
      <Section icon={<Accessibility className="w-5 h-5 text-emerald-500" />} title={t('settings.accessibility')} desc={t('settings.reducedMotionDesc')}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => setSettings({ reducedMotion: e.target.checked })}
            className="w-4 h-4 accent-sky-500"
          />
          <span className="text-sm text-slate-600">{t('settings.reducedMotion')}</span>
        </label>
      </Section>

      {/* Remote AI */}
      <Section icon={<Cloud className="w-5 h-5 text-sky-500" />} title={t('settings.remoteAI')} desc={t('settings.remoteAIDesc')}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSettings({ remoteAIConsent: !settings.remoteAIConsent })}
              className={`relative w-14 h-7 rounded-full transition-colors ${settings.remoteAIConsent ? 'bg-sky-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.remoteAIConsent ? 'left-8' : 'left-1'}`} />
            </button>
            <span className="text-sm text-slate-600">
              {settings.remoteAIConsent ? t('common.on') : t('common.off')}
            </span>
          </div>
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{t('settings.remoteAINote')}</p>
          </div>
        </div>
      </Section>

      {/* Data Management */}
      <Section icon={<Database className="w-5 h-5 text-red-500" />} title={t('settings.data')} desc={t('settings.dataDesc')}>
        <div className="space-y-3">
          <button
            onClick={() => { if (confirm(t('buddy.clearConfirm'))) clearBuddyHistory(); }}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
          >
            <span className="text-sm text-slate-700">{t('settings.clearBuddy')}</span>
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => { clearAllConversations(); }}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-left"
          >
            <span className="text-sm">{t('settings.clearConversations')}</span>
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetAll}
            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors text-left"
          >
            <span className="text-sm font-medium">{t('settings.resetAll')}</span>
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </Section>

      {/* Privacy link */}
      <Section icon={<Shield className="w-5 h-5 text-sky-500" />} title={t('settings.privacy')} desc={t('settings.privacyDesc')}>
        <button
          onClick={() => setCurrentPage('privacy')}
          className="text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          {t('privacy.title')} →
        </button>
      </Section>

      {/* About */}
      <Section icon={<Info className="w-5 h-5 text-slate-400" />} title={t('settings.about')} desc={t('settings.aboutDesc')}>
        <p className="text-sm text-slate-600">{t('settings.aboutDesc')}</p>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
