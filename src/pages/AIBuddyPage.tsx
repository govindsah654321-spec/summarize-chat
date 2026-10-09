import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { RobotAvatar } from '@/components/RobotAvatar';
import {
  generateBuddyReply,
  createBuddyMessage,
} from '@/utils/buddyEngine';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognition,
  speakText,
  stopSpeaking,
} from '@/utils/voice';
import { getRecognitionLang, getClosestVoice, getVoicesForLang } from '@/i18n/voiceUtils';
import type { SpeechSynthesisVoice } from '@/types/speech';
import type { BuddyMessage, RobotState } from '@/types';
import { ImportChatModal } from '@/components/ImportChatModal';
import { createSampleConversation } from '@/data/sampleData';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Trash2,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  AlertCircle,
  Upload,
  Sparkles,
} from 'lucide-react';

const SUGGESTION_KEYS = [
  'suggestion.missed',
  'suggestion.important',
  'suggestion.deadline',
  'suggestion.whoAsked',
  'suggestion.doFirst',
  'suggestion.simpleHindi',
  'suggestion.likeFriend',
  'suggestion.whyUrgent',
  'suggestion.showOriginal',
  'suggestion.helpStep',
];

export function AIBuddyPage() {
  const {
    t,
    settings,
    setSettings,
    conversations,
    analysis,
    language,
    buddyHistory,
    addBuddyMessage,
    clearBuddyHistory,
    setCurrentPage,
    addConversation,
  } = useApp();

  const [input, setInput] = useState('');
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const [showSourceFor, setShowSourceFor] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null);
  const lastReplyRef = useRef<string>('');

  const srSupported = isSpeechRecognitionSupported();
  const ssSupported = isSpeechSynthesisSupported();

  // Load voices
  useEffect(() => {
    if (!ssSupported) return;
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);
      if (!settings.voiceURI && allVoices.length > 0) {
        const closest = getClosestVoice(allVoices, language);
        if (closest) {
          setSettings({ voiceURI: closest.voiceURI });
        }
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ssSupported]);

  // Update voice when language changes
  useEffect(() => {
    if (!ssSupported || voices.length === 0) return;
    const langVoices = getVoicesForLang(voices, language);
    if (langVoices.length > 0 && !langVoices.find((v) => v.voiceURI === settings.voiceURI)) {
      const closest = getClosestVoice(voices, language);
      if (closest) {
        setSettings({ voiceURI: closest.voiceURI });
      }
    }
  }, [language, voices]);

  // Greeting on first load
  useEffect(() => {
    if (!hasGreeted && buddyHistory.length === 0) {
      setRobotState('speaking');
      const greeting = createBuddyMessage('assistant', t('buddy.greeting'));
      addBuddyMessage(greeting);
      setHasGreeted(true);
      setTimeout(() => setRobotState('idle'), 2000);
    }
  }, [hasGreeted, buddyHistory.length, t, addBuddyMessage]);

  // Listen for prompts from dashboard quick actions
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail) {
        setInput(detail);
        setTimeout(() => handleSend(detail), 100);
      }
    };
    window.addEventListener('buddy-prompt', handler);
    return () => window.removeEventListener('buddy-prompt', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, analysis, language]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [buddyHistory]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const doSpeak = useCallback(
    (text: string) => {
      if (settings.muted || !ssSupported || !settings.voiceEnabled) return;
      speakText(
        text,
        settings.voiceURI,
        settings.speechRate,
        () => {
          setIsSpeaking(false);
          setRobotState('idle');
        },
        () => {
          setIsSpeaking(true);
          setRobotState('speaking');
        }
      );
    },
    [settings, ssSupported]
  );

  const handleSend = useCallback(
    (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text) return;

      setError(null);
      setInput('');
      setInterimText('');

      const userMsg = createBuddyMessage('user', text);
      addBuddyMessage(userMsg);

      setRobotState('thinking');

      setTimeout(() => {
        try {
          const reply = generateBuddyReply(text, {
            conversations,
            analysis,
            language,
          });

          const assistantMsg = createBuddyMessage(
            'assistant',
            reply.text,
            reply.sourceMessageIds,
            reply.originalMessages
          );
          addBuddyMessage(assistantMsg);
          lastReplyRef.current = reply.text;
          setRobotState('idle');
          doSpeak(reply.text);
        } catch (err) {
          setError(t('error.generic'));
          setRobotState('idle');
        }
      }, 600);
    },
    [input, conversations, analysis, language, t, addBuddyMessage, doSpeak]
  );

  const handleMic = () => {
    if (!srSupported) {
      setError(t('buddy.voiceUnsupported'));
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setRobotState('idle');
      return;
    }

    setError(null);
    const recognition = createSpeechRecognition(getRecognitionLang(language));
    if (!recognition) {
      setError(t('buddy.micError'));
      return;
    }

    let finalText = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      setInterimText(finalText + interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError(t('buddy.micDenied'));
      } else {
        setError(t('buddy.micError'));
      }
      setIsListening(false);
      setRobotState('idle');
    };

    recognition.onend = () => {
      setIsListening(false);
      setRobotState('idle');
      if (finalText.trim()) {
        setInput(finalText.trim());
        handleSend(finalText.trim());
      }
      setInterimText('');
    };

    recognition.onstart = () => {
      setIsListening(true);
      setRobotState('listening');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStopSpeak = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setRobotState('idle');
  };

  const handleReplay = () => {
    if (lastReplyRef.current) {
      doSpeak(lastReplyRef.current);
    }
  };

  const handleClear = () => {
    if (confirm(t('buddy.clearConfirm'))) {
      clearBuddyHistory();
      setShowSourceFor(null);
    }
  };

  const langVoices = getVoicesForLang(voices, language);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RobotAvatar state={robotState} size={56} reducedMotion={settings.reducedMotion} />
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-500" />
                {t('buddy.title')}
              </h1>
              <p className="text-xs text-slate-500">{t('buddy.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard.importChat')}</span>
            </button>
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label={t('buddy.voiceSettings')}
              title={t('buddy.voiceSettings')}
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleReplay}
              disabled={!lastReplyRef.current}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
              aria-label={t('buddy.replay')}
              title={t('buddy.replay')}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
              aria-label={t('buddy.clear')}
              title={t('buddy.clear')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">{t('buddy.voiceSettings')}</h3>
            {!ssSupported ? (
              <p className="text-sm text-amber-600">{t('buddy.voiceNotSupported')}</p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 w-20">{t('buddy.voiceSelect')}</label>
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
                  <label className="text-sm text-slate-600 w-20">{t('buddy.speed')}</label>
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
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.voiceEnabled}
                      onChange={(e) => setSettings({ voiceEnabled: e.target.checked })}
                      className="accent-sky-500"
                    />
                    {t('settings.voiceEnabled')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.muted}
                      onChange={(e) => setSettings({ muted: e.target.checked })}
                      className="accent-sky-500"
                    />
                    {t('settings.muted')}
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-3 flex items-start gap-2 p-2.5 bg-sky-50 rounded-lg">
          <Info className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700">{t('buddy.disclaimer')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 mb-3">
        {buddyHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <RobotAvatar state={conversations.length === 0 ? 'listening' : 'idle'} size={80} reducedMotion={settings.reducedMotion} />
            {conversations.length === 0 ? (
              <>
                <p className="text-slate-500 mt-4 mb-1 font-medium">{t('buddy.noContext')}</p>
                <p className="text-slate-400 text-sm mb-5 max-w-sm">{t('conversations.emptyDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      const conv = createSampleConversation();
                      addConversation(conv);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium hover:bg-amber-100 transition-colors text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('conversations.loadDemo')}
                  </button>
                  <button
                    onClick={() => setShowImport(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    {t('dashboard.importChat')}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-slate-400 mt-4">{t('buddy.empty')}</p>
            )}
          </div>
        ) : (
          buddyHistory.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              showSource={showSourceFor === msg.id}
              onToggleSource={() =>
                setShowSourceFor(showSourceFor === msg.id ? null : msg.id)
              }
            />
          ))
        )}

        {/* Typing indicator */}
        {robotState === 'thinking' && (
          <div className="flex items-center gap-2 px-3">
            <RobotAvatar state="thinking" size={32} reducedMotion={settings.reducedMotion} />
            <span className="text-sm text-slate-400">{t('buddy.typing')}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {buddyHistory.length <= 1 && (
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-2 px-1">{t('buddy.suggestions')}</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => handleSend(t(key))}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-all"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
        {isListening && (
          <div className="mb-2 px-3 py-2 bg-red-50 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-600">{t('buddy.listeningHint')}</span>
          </div>
        )}
        {interimText && (
          <div className="mb-2 px-3 py-2 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-500 italic">{interimText}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMic}
            disabled={!srSupported}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
              isListening
                ? 'bg-red-500 text-white shadow-md shadow-red-200'
                : srSupported
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
            aria-label={isListening ? t('buddy.micListening') : t('buddy.mic')}
            title={srSupported ? t('buddy.mic') : t('buddy.voiceUnsupported')}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('buddy.placeholder')}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          />

          {isSpeaking ? (
            <button
              onClick={handleStopSpeak}
              className="p-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors flex-shrink-0"
              aria-label={t('buddy.stop')}
            >
              <VolumeX className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors disabled:opacity-30 flex-shrink-0"
              aria-label={t('buddy.send')}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        {!srSupported && (
          <p className="text-xs text-slate-400 mt-2 px-1">{t('buddy.voiceUnsupported')}</p>
        )}
      </div>

      {/* Consent dialog */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{t('buddy.consentTitle')}</h3>
              <button onClick={() => setShowConsent(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{t('buddy.consentDesc')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSettings({ remoteAIConsent: true });
                  setShowConsent(false);
                }}
                className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600"
              >
                {t('buddy.consentEnable')}
              </button>
              <button
                onClick={() => setShowConsent(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"
              >
                {t('buddy.consentKeepLocal')}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">{t('buddy.consentNote')}</p>
          </div>
        </div>
      )}

      {/* Import Chat Modal */}
      <ImportChatModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}

interface MessageBubbleProps {
  msg: BuddyMessage;
  showSource: boolean;
  onToggleSource: () => void;
}

function MessageBubble({ msg, showSource, onToggleSource }: MessageBubbleProps) {
  const { t } = useApp();
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
            isUser
              ? 'bg-sky-500 text-white rounded-br-md'
              : 'bg-slate-100 text-slate-800 rounded-bl-md'
          }`}
        >
          {!isUser && (
            <div className="text-xs font-semibold text-sky-600 mb-1 flex items-center gap-1">
              <Bot className="w-3 h-3" />
              {t('buddy.assistantLabel')}
            </div>
          )}
          {msg.text}
        </div>

        {/* Source references */}
        {!isUser && msg.originalMessages && msg.originalMessages.length > 0 && (
          <div className="mt-1.5">
            <button
              onClick={onToggleSource}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              {showSource ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  {t('buddy.hideSource')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  {t('buddy.showSource')}
                </>
              )}
            </button>
            {showSource && (
              <div className="mt-2 space-y-2">
                {msg.originalMessages.map((src, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-700">{src.sender}</span>
                      <span className="text-slate-400">
                        {new Date(src.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 italic">"{src.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={`text-xs text-slate-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

interface FloatingBuddyProps {
  onClick: () => void;
}

export function FloatingBuddyButton({ onClick }: FloatingBuddyProps) {
  const { settings, t } = useApp();
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-300 hover:bg-sky-600 transition-all hover:scale-105 group"
      aria-label={t('nav.aibuddy')}
    >
      <div className="relative">
        <RobotAvatar state="idle" size={36} reducedMotion={settings.reducedMotion} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
      </div>
      <span className="text-sm font-medium hidden sm:inline">{t('buddy.title')}</span>
    </button>
  );
}
