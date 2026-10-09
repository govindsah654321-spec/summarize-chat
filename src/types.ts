export type LanguageCode = 'en' | 'hi' | 'ne';

export type RobotState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number; // epoch ms
  isOwn: boolean;
  originalText?: string; // for translated messages
  translatedText?: string;
  sourceLanguage?: LanguageCode;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  importedAt: number;
  isSample?: boolean;
  sourceFileName?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  messageId: string;
  conversationId: string;
  assignedTo?: string;
  dueDate?: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category: ActionCategory;
}

export type ActionCategory =
  | 'assignment'
  | 'exam'
  | 'meeting'
  | 'task'
  | 'project'
  | 'event'
  | 'request'
  | 'general';

export interface Decision {
  id: string;
  text: string;
  messageId: string;
  conversationId: string;
}

export interface Deadline {
  id: string;
  text: string;
  messageId: string;
  conversationId: string;
  date?: number;
  category: ActionCategory;
}

export interface Summary {
  conversationId: string;
  keyPoints: string[];
  generatedAt: number;
  language: LanguageCode;
}

export interface AnalysisResult {
  actionItems: ActionItem[];
  decisions: Decision[];
  deadlines: Deadline[];
  summary: Summary;
}

export interface BuddyMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  sourceMessageIds?: string[];
  originalMessages?: { sender: string; text: string; timestamp: number }[];
}

export interface AppSettings {
  language: LanguageCode;
  studentMode: boolean;
  voiceEnabled: boolean;
  voiceURI: string | null;
  speechRate: number;
  muted: boolean;
  remoteAIConsent: boolean;
  reducedMotion: boolean;
}

export interface ConversationMode {
  id: string;
  labelKey: string;
  icon: string;
  prompt: string;
}

export type Page =
  | 'dashboard'
  | 'conversations'
  | 'aibuddy'
  | 'studentlife'
  | 'settings'
  | 'privacy';

export interface BriefingItem {
  id: string;
  type: 'urgent' | 'deadline' | 'task' | 'request';
  text: string;
  messageId: string;
  conversationId: string;
  dueDate?: number;
  completed: boolean;
  category: ActionCategory;
  sourceMessage?: ChatMessage;
}
