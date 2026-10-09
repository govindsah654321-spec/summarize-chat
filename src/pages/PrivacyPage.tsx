import { useApp } from '@/context/AppContext';
import {
  Shield,
  Lock,
  Database,
  Key,
  Cloud,
  Mic,
  FileCheck,
  Trash2,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

export function PrivacyPage() {
  const { t, resetAll, conversations, buddyHistory, settings, setCurrentPage, analysis } = useApp();

  const actionItemCount = Object.values(analysis).reduce((acc, a) => acc + a.actionItems.length, 0);

  const dataItems = [
    { label: t('nav.conversations'), count: conversations.length },
    { label: t('nav.aibuddy') + ' ' + t('conversations.messages'), count: buddyHistory.length },
    { label: t('conversations.actionItems'), count: actionItemCount },
  ];

  const handleDeleteAll = () => {
    if (confirm(t('privacy.deleteAllConfirm'))) {
      resetAll();
      setCurrentPage('dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentPage('settings')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-sky-500" />
          {t('privacy.title')}
        </h1>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-sky-200">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-6 h-6" />
          <h2 className="text-xl font-bold">{t('privacy.dataOnDevice')}</h2>
        </div>
        <p className="text-sky-100 text-sm">{t('privacy.subtitle')}</p>
      </div>

      {/* Privacy sections */}
      <PrivacySection
        icon={<Database className="w-5 h-5 text-sky-500" />}
        title={t('privacy.localProcessing')}
        desc={t('privacy.localProcessingDesc')}
      />
      <PrivacySection
        icon={<Database className="w-5 h-5 text-emerald-500" />}
        title={t('privacy.storage')}
        desc={t('privacy.storageDesc')}
      />
      <PrivacySection
        icon={<Key className="w-5 h-5 text-amber-500" />}
        title={t('privacy.noKeys')}
        desc={t('privacy.noKeysDesc')}
      />

      {/* Remote AI */}
      <PrivacySection
        icon={<Cloud className="w-5 h-5 text-purple-500" />}
        title={t('privacy.remoteAI')}
        desc={t('privacy.remoteAIDesc')}
      >
        <div className="mt-3 flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            settings.remoteAIConsent ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {settings.remoteAIConsent ? t('common.on') : t('common.off')}
          </div>
          <span className="text-xs text-slate-500">
            {settings.remoteAIConsent ? t('buddy.consentEnable') : t('buddy.consentKeepLocal')}
          </span>
        </div>
      </PrivacySection>

      {/* Voice Data */}
      <PrivacySection
        icon={<Mic className="w-5 h-5 text-pink-500" />}
        title={t('privacy.voiceData')}
        desc={t('privacy.voiceDataDesc')}
      />

      {/* Your Rights */}
      <PrivacySection
        icon={<FileCheck className="w-5 h-5 text-emerald-500" />}
        title={t('privacy.yourRights')}
        desc={t('privacy.yourRightsDesc')}
      />

      {/* Data Summary */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">{t('settings.data')}</h2>
        <div className="space-y-2">
          {dataItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="text-sm font-bold text-slate-800">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delete All */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-red-600 mb-2">{t('privacy.deleteAll')}</h2>
        <p className="text-sm text-slate-500 mb-4">{t('privacy.deleteAllConfirm')}</p>
        <button
          onClick={handleDeleteAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t('privacy.deleteAll')}
        </button>
      </div>

      {/* Assurance badges */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Lock, label: t('privacy.localProcessing') },
          { icon: Key, label: t('privacy.noKeys') },
          { icon: Database, label: t('privacy.storage') },
          { icon: CheckCircle, label: t('privacy.yourRights') },
        ].map((badge, i) => {
          const Icon = badge.icon;
          return (
            <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Icon className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <span className="text-xs text-slate-600">{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrivacySection({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-800 mb-1">{title}</h2>
          <p className="text-sm text-slate-500">{desc}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
