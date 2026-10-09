import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { RobotAvatar } from '@/components/RobotAvatar';
import { createSampleConversation } from '@/data/sampleData';
import {
  Bot,
  Shield,
  Upload,
  ArrowRight,
  Check,
  Sparkles,
  Globe,
} from 'lucide-react';

export function Onboarding() {
  const { t, setOnboarded, addConversation, setCurrentPage, settings } = useApp();
  const [step, setStep] = useState(0);
  const [demoLoaded, setDemoLoaded] = useState(false);

  const handleLoadDemo = () => {
    const conv = createSampleConversation();
    addConversation(conv);
    setDemoLoaded(true);
  };

  const handleFinish = () => {
    setOnboarded(true);
    setCurrentPage('dashboard');
  };

  const handleSkip = () => {
    setOnboarded(true);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <RobotAvatar state="idle" size={100} reducedMotion={settings.reducedMotion} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('onboarding.welcome')}</h1>
          <p className="text-slate-500 max-w-md mx-auto">{t('onboarding.intro')}</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-sky-500' : i < step ? 'w-2 bg-sky-400' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-500" />
                  {t('onboarding.chooseLanguage')}
                </h2>
                <p className="text-sm text-slate-500">{t('onboarding.languageNote')}</p>
              </div>
              <LanguageSelector />
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200"
                >
                  {t('onboarding.getStarted')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">{t('onboarding.demoTitle')}</h2>
                <p className="text-sm text-slate-500">{t('onboarding.demoDesc')}</p>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={handleLoadDemo}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    demoLoaded
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 hover:border-sky-300 bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    demoLoaded ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}>
                    {demoLoaded ? <Check className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{t('onboarding.loadDemo')}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {demoLoaded ? t('onboarding.demoLoaded') : t('onboarding.demoDesc')}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-left">
                  <div className="w-12 h-12 rounded-xl bg-slate-400 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{t('conversations.import')}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t('conversations.importHint')}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl border border-sky-100">
                <Shield className="w-5 h-5 text-sky-600 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-sky-800">{t('onboarding.privacyFirst')}</div>
                  <div className="text-xs text-sky-600 mt-0.5">{t('onboarding.privacyDesc')}</div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="px-5 py-2.5 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200"
                >
                  {t('onboarding.getStarted')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-sky-500" />
                  {t('nav.aibuddy')}
                </h2>
                <p className="text-sm text-slate-500">{t('buddy.subtitle')}</p>
              </div>

              <div className="space-y-3">
                {[
                  t('onboarding.step1'),
                  t('onboarding.step2'),
                  t('onboarding.step3'),
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-700">{s}</span>
                    <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-sm text-amber-800">{t('buddy.disclaimer')}</p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors shadow-md shadow-sky-200"
                >
                  {t('onboarding.getStarted')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
