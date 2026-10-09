import type {
  ChatMessage,
  Conversation,
  AnalysisResult,
  ActionItem,
  Decision,
  Deadline,
  Summary,
  ActionCategory,
  LanguageCode,
} from '@/types';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ACTION_PATTERNS = [
  /\b(?:can you|could you|please|kindly)\s+(.+)/i,
  /\b(?:need to|need you to|you should|you need to|you must)\s+(.+)/i,
  /\b(?:don'?t forget|remember to|make sure to)\s+(.+)/i,
  /\b(?:let'?s|we should|we need to|we must)\s+(.+)/i,
  /\b(?:i(?:'ll| will) (?:send|share|update|check|do|prepare|create|finish|submit|complete))\b/i,
  /\b(?:submit|send|share|upload|complete|finish|prepare|create|review|update|fix|write|read|watch|join|attend|bring|buy|call|text|email)\b/i,
];

const DEADLINE_PATTERNS = [
  /\b(?:by|before|due|deadline(?:\s+is)?|submit(?:\s+by)?|expected\s+by)\s+(.+)/i,
  /\b(?:tomorrow|today|tonight|this\s+week|next\s+week|this\s+weekend)\b/i,
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))\b/i,
  /\b(\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?)\b/i,
  /\b(?:in\s+\d+\s+(?:days?|hours?|weeks?|months?))\b/i,
];

const DECISION_PATTERNS = [
  /\b(?:decided|decision|agreed|conclusion|finalized|confirmed|let'?s go with|i think we should)\b/i,
  /\b(?:we(?:'ll| will) (?:go with|use|do|have|meet|start|begin))\b/i,
  /\b(?:so(?: it'?s)? (?:final|decided|confirmed|settled))\b/i,
];

const CATEGORY_KEYWORDS: Record<ActionCategory, RegExp[]> = {
  assignment: [
    /\b(?:assignment|submission|submit|homework| coursework|project report|lab report|essay|report)\b/i,
  ],
  exam: [
    /\b(?:exam|test|quiz|practical|viva|midterm|final|assessment|mock test)\b/i,
  ],
  meeting: [
    /\b(?:meeting|meet up|gather|call|zoom|google meet|team meeting|club meeting|sync|standup)\b/i,
  ],
  task: [
    /\b(?:task|todo|to-do|do this|finish this|complete this|work on)\b/i,
  ],
  project: [
    /\b(?:project|prototype|demo|presentation|slides|deliverable|milestone|sprint|hackathon)\b/i,
  ],
  event: [
    /\b(?:event|festival|function|cultural|sports|party|celebration|club event|tech fest)\b/i,
  ],
  request: [
    /\b(?:can you|could you|please|would you|need you to|ask(?:ing)? you to)\b/i,
  ],
  general: [],
};

const PRIORITY_HIGH_KEYWORDS = [
  /\b(?:urgent|asap|immediately|critical|important|right away|now)\b/i,
];
const PRIORITY_LOW_KEYWORDS = [
  /\b(?:whenever|no rush|when you get time|low priority|not urgent|later|someday)\b/i,
];

function detectCategory(text: string): ActionCategory {
  const lowerText = text.toLowerCase();
  for (const [cat, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'general') continue;
    for (const p of patterns) {
      if (p.test(lowerText)) return cat as ActionCategory;
    }
  }
  return 'general';
}

function detectPriority(text: string): 'high' | 'medium' | 'low' {
  for (const p of PRIORITY_HIGH_KEYWORDS) {
    if (p.test(text)) return 'high';
  }
  for (const p of PRIORITY_LOW_KEYWORDS) {
    if (p.test(text)) return 'low';
  }
  return 'medium';
}

function detectDate(text: string): number | undefined {
  const now = new Date();
  const lowerText = text.toLowerCase();

  if (/\btomorrow\b/i.test(lowerText)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  if (/\btoday\b/i.test(lowerText)) return now.getTime();
  if (/\btonight\b/i.test(lowerText)) return now.getTime();

  const days = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ];
  for (let i = 0; i < days.length; i++) {
    const re = new RegExp(`\\b${days[i]}\\b`, 'i');
    if (re.test(lowerText)) {
      const d = new Date(now);
      const currentDay = d.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      if (/\bnext\s+week\b/i.test(lowerText)) diff += 7;
      d.setDate(d.getDate() + diff);
      return d.getTime();
    }
  }

  const monthMatch = lowerText.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/
  );
  if (monthMatch) {
    const day = parseInt(monthMatch[1]);
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthAbbr = monthMatch[2].slice(0, 3);
    const month = months.indexOf(monthAbbr);
    if (month >= 0) {
      const d = new Date(now.getFullYear(), month, day);
      if (d.getTime() < now.getTime()) d.setFullYear(now.getFullYear() + 1);
      return d.getTime();
    }
  }

  const inDaysMatch = lowerText.match(/in\s+(\d+)\s+(days?|weeks?)/);
  if (inDaysMatch) {
    const n = parseInt(inDaysMatch[1]);
    const isWeek = /week/i.test(inDaysMatch[2]);
    const d = new Date(now);
    d.setDate(d.getDate() + n * (isWeek ? 7 : 1));
    return d.getTime();
  }

  return undefined;
}

function detectAssignedTo(text: string, sender: string): string | undefined {
  const atMatch = text.match(/@(\w+)/);
  if (atMatch) return atMatch[1];
  if (/\b(?:you|your)\b/i.test(text)) return 'You';
  if (/\b(?:everyone|all|guys|team)\b/i.test(text)) return 'Everyone';
  return sender;
}

function matchAny(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

function extractActionItems(
  messages: ChatMessage[],
  conversationId: string
): ActionItem[] {
  const items: ActionItem[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    const text = msg.text;
    if (text.length < 10) continue;

    const isAction = matchAny(ACTION_PATTERNS, text);
    if (!isAction) continue;

    const snippet = text.slice(0, 200);
    if (seen.has(snippet)) continue;
    seen.add(snippet);

    items.push({
      id: genId(),
      text: snippet,
      messageId: msg.id,
      conversationId,
      assignedTo: detectAssignedTo(text, msg.sender),
      dueDate: detectDate(text),
      priority: detectPriority(text),
      completed: false,
      category: detectCategory(text),
    });
  }

  return items;
}

function extractDeadlines(
  messages: ChatMessage[],
  conversationId: string
): Deadline[] {
  const deadlines: Deadline[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    const text = msg.text;
    if (text.length < 10) continue;

    if (!matchAny(DEADLINE_PATTERNS, text)) continue;

    const snippet = text.slice(0, 200);
    if (seen.has(snippet)) continue;
    seen.add(snippet);

    deadlines.push({
      id: genId(),
      text: snippet,
      messageId: msg.id,
      conversationId,
      date: detectDate(text),
      category: detectCategory(text),
    });
  }

  return deadlines;
}

function extractDecisions(
  messages: ChatMessage[],
  conversationId: string
): Decision[] {
  const decisions: Decision[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    const text = msg.text;
    if (text.length < 10) continue;

    if (!matchAny(DECISION_PATTERNS, text)) continue;

    const snippet = text.slice(0, 200);
    if (seen.has(snippet)) continue;
    seen.add(snippet);

    decisions.push({
      id: genId(),
      text: snippet,
      messageId: msg.id,
      conversationId,
    });
  }

  return decisions;
}

function generateSummary(
  messages: ChatMessage[],
  conversationId: string,
  language: LanguageCode
): Summary {
  const keyPoints: string[] = [];

  const senders = new Set(messages.map((m) => m.sender));
  const senderList = Array.from(senders).slice(0, 5).join(', ');

  const totalMessages = messages.length;
  keyPoints.push(`${totalMessages} messages from ${senders.size} participants`);

  const actionWords = messages.filter((m) =>
    /\b(?:submit|deadline|meeting|exam|assignment|project|urgent|asap|tomorrow|today)\b/i.test(
      m.text
    )
  );
  if (actionWords.length > 0) {
    keyPoints.push(`${actionWords.length} messages mention tasks, deadlines, or events`);
  }

  const recentMessages = messages.slice(-10);
  const recentTopic = recentMessages
    .map((m) => m.text)
    .join(' ')
    .slice(0, 300);
  if (recentTopic) {
    const words = recentTopic
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 20)
      .join(' ');
    if (words) {
      keyPoints.push(`Recent discussion: ${words}...`);
    }
  }

  if (senderList) {
    keyPoints.push(`Active participants: ${senderList}`);
  }

  const dateRange = messages.length > 0
    ? `${new Date(messages[0].timestamp).toLocaleDateString()} - ${new Date(
        messages[messages.length - 1].timestamp
      ).toLocaleDateString()}`
    : 'N/A';
  keyPoints.push(`Conversation period: ${dateRange}`);

  return {
    conversationId,
    keyPoints,
    generatedAt: Date.now(),
    language,
  };
}

export function analyzeConversation(
  conversation: Conversation,
  language: LanguageCode = 'en'
): AnalysisResult {
  const messages = conversation.messages;

  const actionItems = extractActionItems(messages, conversation.id);
  const deadlines = extractDeadlines(messages, conversation.id);
  const decisions = extractDecisions(messages, conversation.id);
  const summary = generateSummary(messages, conversation.id, language);

  return { actionItems, decisions, deadlines, summary };
}

export function reanalyzeAll(
  conversations: Conversation[],
  language: LanguageCode
): Record<string, AnalysisResult> {
  const results: Record<string, AnalysisResult> = {};
  for (const conv of conversations) {
    results[conv.id] = analyzeConversation(conv, language);
  }
  return results;
}
