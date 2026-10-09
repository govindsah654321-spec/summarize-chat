import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AppSettings,
  Conversation,
  AnalysisResult,
  BuddyMessage,
  LanguageCode,
  Page,
} from '@/types';
import {
  loadSettings,
  saveSettings,
  loadConversations,
  saveConversations,
  loadAnalysis,
  saveAnalysis,
  loadBuddyHistory,
  saveBuddyHistory,
  loadOnboarded,
  saveOnboarded,
  clearBuddyHistory as storageClearBuddy,
  clearConversations as storageClearConvs,
  clearAll as storageClearAll,
  updateActionItem as storageUpdateAction,
} from '@/utils/storage';
import { analyzeConversation } from '@/utils/analyzer';
import { t as translate, LANGUAGES } from '@/i18n/translations';

interface AppContextValue {
  settings: AppSettings;
  setSettings: (s: Partial<AppSettings>) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;

  conversations: Conversation[];
  addConversation: (conv: Conversation) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;

  analysis: Record<string, AnalysisResult>;
  getAnalysis: (conversationId: string) => AnalysisResult | null;
  regenerateAnalysis: (conversationId: string) => void;

  actionItems: { item: import('@/types').ActionItem; conversationId: string }[];
  toggleActionItem: (conversationId: string, itemId: string) => void;

  buddyHistory: BuddyMessage[];
  addBuddyMessage: (msg: BuddyMessage) => void;
  clearBuddyHistory: () => void;

  onboarded: boolean;
  setOnboarded: (v: boolean) => void;

  currentPage: Page;
  setCurrentPage: (p: Page) => void;

  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;

  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings());
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations());
  const [analysis, setAnalysis] = useState<Record<string, AnalysisResult>>(loadAnalysis());
  const [buddyHistory, setBuddyHistory] = useState<BuddyMessage[]>(loadBuddyHistory());
  const [onboarded, setOnboardedState] = useState<boolean>(loadOnboarded());
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches && !settings.reducedMotion) {
        setSettingsState((s) => ({ ...s, reducedMotion: true }));
      }
    }
  }, []);

  const setSettings = useCallback((s: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...s };
      saveSettings(next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setSettings({ language: lang });
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translate(settings.language, key, fallback),
    [settings.language]
  );

  const addConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      const next = [...prev, conv];
      saveConversations(next);
      return next;
    });
    const result = analyzeConversation(conv, settings.language);
    setAnalysis((prev) => {
      const next = { ...prev, [conv.id]: result };
      saveAnalysis(next);
      return next;
    });
  }, [settings.language]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveConversations(next);
      return next;
    });
    setAnalysis((prev) => {
      const next = { ...prev };
      delete next[id];
      saveAnalysis(next);
      return next;
    });
  }, []);

  const clearAllConversations = useCallback(() => {
    storageClearConvs();
    setConversations([]);
    setAnalysis({});
  }, []);

  const getAnalysis = useCallback(
    (conversationId: string) => analysis[conversationId] || null,
    [analysis]
  );

  const regenerateAnalysis = useCallback(
    (conversationId: string) => {
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) return;
      const result = analyzeConversation(conv, settings.language);
      setAnalysis((prev) => {
        const next = { ...prev, [conversationId]: result };
        saveAnalysis(next);
        return next;
      });
    },
    [conversations, settings.language]
  );

  const toggleActionItem = useCallback((conversationId: string, itemId: string) => {
    setAnalysis((prev) => {
      const convAnalysis = prev[conversationId];
      if (!convAnalysis) return prev;
      const updated = {
        ...convAnalysis,
        actionItems: convAnalysis.actionItems.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        ),
      };
      const next = { ...prev, [conversationId]: updated };
      saveAnalysis(next);
      storageUpdateAction(conversationId, itemId, !convAnalysis.actionItems.find((i) => i.id === itemId)?.completed);
      return next;
    });
  }, []);

  const allActionItems = useCallback(() => {
    const items: { item: import('@/types').ActionItem; conversationId: string }[] = [];
    for (const key of Object.keys(analysis)) {
      for (const item of analysis[key].actionItems) {
        items.push({ item, conversationId: key });
      }
    }
    return items;
  }, [analysis]);

  const addBuddyMessage = useCallback((msg: BuddyMessage) => {
    setBuddyHistory((prev) => {
      const next = [...prev, msg];
      saveBuddyHistory(next);
      return next;
    });
  }, []);

  const clearBuddyHistory = useCallback(() => {
    storageClearBuddy();
    setBuddyHistory([]);
  }, []);

  const setOnboarded = useCallback((v: boolean) => {
    saveOnboarded(v);
    setOnboardedState(v);
  }, []);

  const resetAll = useCallback(() => {
    storageClearAll();
    setSettingsState({
      language: 'en',
      studentMode: false,
      voiceEnabled: true,
      voiceURI: null,
      speechRate: 1,
      muted: false,
      remoteAIConsent: false,
      reducedMotion: false,
    });
    setConversations([]);
    setAnalysis({});
    setBuddyHistory([]);
    setOnboardedState(false);
    setCurrentPage('dashboard');
    setSelectedConversationId(null);
  }, []);

  const value: AppContextValue = {
    settings,
    setSettings,
    language: settings.language,
    setLanguage,
    t,
    conversations,
    addConversation,
    deleteConversation,
    clearAllConversations,
    analysis,
    getAnalysis,
    regenerateAnalysis,
    actionItems: allActionItems(),
    toggleActionItem,
    buddyHistory,
    addBuddyMessage,
    clearBuddyHistory,
    onboarded,
    setOnboarded,
    currentPage,
    setCurrentPage,
    selectedConversationId,
    setSelectedConversationId,
    resetAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { LANGUAGES };
