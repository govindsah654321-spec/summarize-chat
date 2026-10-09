import type {
  AppSettings,
  BuddyMessage,
  Conversation,
  AnalysisResult,
  ActionItem,
} from '@/types';

const KEYS = {
  settings: 'catchup_settings',
  conversations: 'catchup_conversations',
  analysis: 'catchup_analysis',
  buddy: 'catchup_buddy_history',
  onboarded: 'catchup_onboarded',
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  studentMode: false,
  voiceEnabled: true,
  voiceURI: null,
  speechRate: 1,
  muted: false,
  remoteAIConsent: false,
  reducedMotion: false,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): AppSettings {
  return safeParse(localStorage.getItem(KEYS.settings), DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function loadConversations(): Conversation[] {
  return safeParse<Conversation[]>(localStorage.getItem(KEYS.conversations), []);
}

export function saveConversations(conversations: Conversation[]): void {
  localStorage.setItem(KEYS.conversations, JSON.stringify(conversations));
}

export function loadAnalysis(): Record<string, AnalysisResult> {
  return safeParse<Record<string, AnalysisResult>>(
    localStorage.getItem(KEYS.analysis),
    {}
  );
}

export function saveAnalysis(analysis: Record<string, AnalysisResult>): void {
  localStorage.setItem(KEYS.analysis, JSON.stringify(analysis));
}

export function loadBuddyHistory(): BuddyMessage[] {
  return safeParse<BuddyMessage[]>(localStorage.getItem(KEYS.buddy), []);
}

export function saveBuddyHistory(history: BuddyMessage[]): void {
  localStorage.setItem(KEYS.buddy, JSON.stringify(history));
}

export function loadOnboarded(): boolean {
  return localStorage.getItem(KEYS.onboarded) === 'true';
}

export function saveOnboarded(value: boolean): void {
  localStorage.setItem(KEYS.onboarded, value ? 'true' : 'false');
}

export function clearBuddyHistory(): void {
  localStorage.removeItem(KEYS.buddy);
}

export function clearConversations(): void {
  localStorage.removeItem(KEYS.conversations);
  localStorage.removeItem(KEYS.analysis);
}

export function clearAll(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function updateActionItem(
  conversationId: string,
  itemId: string,
  completed: boolean
): void {
  const analysis = loadAnalysis();
  const conv = analysis[conversationId];
  if (!conv) return;
  conv.actionItems = conv.actionItems.map((item: ActionItem) =>
    item.id === itemId ? { ...item, completed } : item
  );
  analysis[conversationId] = conv;
  saveAnalysis(analysis);
}
