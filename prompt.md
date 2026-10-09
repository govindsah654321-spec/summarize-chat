# CatchUp AI — Project Prompt

## Overview

**CatchUp AI** is a local-first, multilingual conversation companion app designed primarily for college students. It helps users import group chat exports (WhatsApp, text files, or pasted text), automatically analyzes them for action items, deadlines, and decisions, and provides a friendly AI Buddy that answers questions about those conversations — all processed in the browser with no external API keys or servers.

The app supports three languages: **English, Hindi, and Nepali**.

---

## Problem It Solves

Students in group chats (class groups, project teams, club chats) miss messages and fall behind. When they return, they face hundreds of messages and struggle to figure out:

- What did I miss?
- What's urgent?
- What are my deadlines?
- Who asked me to do something?
- What should I do first?

CatchUp AI turns a wall of messages into a clear, actionable briefing — and lets users ask follow-up questions to an AI Buddy that references the actual source messages.

---

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS 3
- **Icons:** lucide-react
- **State:** React Context + localStorage persistence (no backend required)
- **i18n:** Custom translation system (English, Hindi, Nepali)
- **Voice:** Web Speech API (SpeechRecognition + SpeechSynthesis)

No external dependencies beyond the above. No API keys. No server. Everything runs client-side.

---

## Pages & Navigation

The app has a sidebar navigation layout with these pages:

### 1. Onboarding (first-run only)
- 3-step welcome flow: choose language → load demo or import chat → meet AI Buddy
- Privacy-first messaging emphasized throughout
- Can be skipped; re-triggered only by full data reset

### 2. Dashboard
- Welcome banner with Import Chat and Load Demo buttons
- Stats grid: conversations count, action items, deadlines, requests
- Quick Actions cards that route to AI Buddy with pre-filled prompts (Catch me up, Explain simply, Help with a task, Find a deadline, Practice in my language)
- Upcoming Deadlines panel (next 5, sorted by date)
- Unfinished Tasks panel (next 5 incomplete action items)
- Recent Activity panel (last 5 imported conversations)
- Empty state with Load Demo, Import Chat, and View All buttons

### 3. Conversations
- List view: all imported conversations with message count, action item count, deadline count, demo badge
- Detail view: per-conversation analysis panels (Action Items, Deadlines, Decisions, Key Points summary), full message list with search, message-level "show original/translation" toggle
- Import modal: paste text or upload .txt/.csv/.json file
- Load Demo Conversation button (sample college group chat)
- Action items can be toggled complete/incomplete
- Regenerate analysis button
- Delete individual conversations

### 4. AI Buddy
- Chat interface with the robot companion
- Text input + voice input (speech recognition) + voice output (speech synthesis)
- Intent-based local engine that answers questions by searching imported conversations
- Supported intents: missed messages, important items, deadlines, who asked me, what to do first, explain simply, explain like a friend, why urgent, show original, help step by step, tasks, exams, meetings
- Every response includes source message references (sender, text, timestamp)
- Voice settings panel: voice selection, speech rate, enable/mute toggles
- Suggestion chips for first-time users
- Remote AI consent dialog (opt-in, off by default)
- Floating buddy button on all other pages for quick access
- Empty state detects no conversations and shows inline Load Demo + Import buttons

### 5. Student Life Mode
- Toggle to enable student-focused filtering
- Daily briefing banner with counts of urgent items, deadlines, tasks, requests
- Urgent Items panel (high priority or due within 2 days)
- Upcoming Deadlines panel (sorted chronologically)
- Unfinished Tasks panel (filterable by student categories: assignment, exam, meeting, task, project, event, request)
- Unanswered Requests panel
- Each item shows category badge, priority badge, due date, and links back to source conversation
- Evidence note: "Based only on messages found in your imported conversations"

### 6. Settings
- Language selector
- Student Life Mode toggle
- Voice settings (enable, voice select, speech rate, mute)
- Remote AI provider toggle (opt-in, with clear privacy warning)
- Accessibility: reduced motion toggle
- Data management: clear buddy history, delete all conversations, reset all data
- About section

### 7. Privacy Center
- Local processing explanation
- Local storage explanation (browser localStorage)
- No API keys statement
- Remote AI (optional) explanation
- Voice data explanation
- User rights (delete anytime, export by copying)
- Delete all data button

---

## Core Systems

### Analysis Engine (`src/utils/analyzer.ts`)
Runs entirely in the browser. Uses regex pattern matching to extract:
- **Action Items:** messages containing "can you", "need to", "don't forget", "let's", "submit", "send", "prepare", etc. — categorized by type (assignment, exam, meeting, task, project, event, request, general) with priority detection (high/medium/low) and date extraction.
- **Deadlines:** messages with date references ("by Friday", "tomorrow", "15th October", "in 3 days", date formats).
- **Decisions:** messages with "decided", "agreed", "confirmed", "let's go with", etc.
- **Summary:** key points including participant count, message count, action-word frequency, recent topic extraction, date range.

### Buddy Engine (`src/utils/buddyEngine.ts`)
Local intent-detection chat engine. Detects user intent from their question, searches imported conversations, and generates a contextual response in the user's selected language (English/Hindi/Nepali). Always references source messages. No external API calls.

### Chat Parser (`src/utils/chatParser.ts`)
Parses pasted text or uploaded files into structured Conversation objects with sender, text, timestamp, and isOwn fields.

### Internationalization (`src/i18n/translations.ts`)
Full UI translation in English, Hindi, and Nepali. ~150+ translation keys covering all pages, labels, AI Buddy responses, and common UI strings.

### Voice System (`src/utils/voice.ts`, `src/i18n/voiceUtils.ts`)
- Speech recognition with language mapping (en → en-US, hi → hi-IN, ne → ne-NP)
- Speech synthesis with voice selection filtered by language
- Fallback gracefully when Web Speech API is unavailable

### Storage (`src/utils/storage.ts`)
All data persists in browser localStorage: settings, conversations, analysis results, buddy chat history, onboarding state. No server, no cloud sync.

### State Management (`src/context/AppContext.tsx`)
Single React Context provider managing all app state: settings, conversations, analysis, buddy history, onboarding, current page, selected conversation. Auto-persists to localStorage on every change. Auto-triggers analysis when a conversation is added.

---

## Design System

- **Color palette:** Sky blue primary, amber/orange accent for student mode, emerald for success/task completion, red for urgent/destructive, slate neutrals
- **Typography:** System font stack, 3 weights max (normal, medium, bold)
- **Spacing:** 8px-based system
- **Border radius:** rounded-xl (12px) for cards, rounded-2xl (16px) for major containers, rounded-lg (8px) for buttons
- **Shadows:** Subtle shadow-sm for cards, shadow-lg for banners and modals
- **Animations:** Robot avatar states (idle, listening, thinking, speaking), hover transitions, typing indicator pulse, reduced-motion accessibility support
- **Responsive:** Mobile-first, sidebar collapses on small screens, grids reflow at sm/lg breakpoints

---

## Sample Data

A built-in sample conversation (`src/data/sampleData.ts`) simulates a college group chat with multiple participants discussing assignments, exams, project deadlines, meetings, and social events — giving users an instant demo of all features without importing anything.

---

## Privacy Architecture

- **Default: 100% local.** All parsing, analysis, and AI Buddy responses run in the browser.
- **No API keys** embedded anywhere in the app.
- **No network calls** unless user explicitly opts into Remote AI (consent dialog).
- **Data never leaves the device** — stored in browser localStorage.
- **User controls:** clear history, delete conversations, reset all — all available in Settings and Privacy Center.

---

## File Structure

```
src/
├── App.tsx                      # Root: AppProvider + page routing
├── main.tsx                     # Entry point
├── index.css                    # Tailwind + global styles
├── types.ts                     # All TypeScript interfaces
├── types/speech.ts              # Speech synthesis voice types
├── context/AppContext.tsx       # Global state + localStorage persistence
├── data/sampleData.ts           # Demo college group chat
├── i18n/
│   ├── translations.ts          # EN/HI/NE translation dictionaries
│   └── voiceUtils.ts            # Language → voice/recognition mapping
├── utils/
│   ├── analyzer.ts              # Local analysis engine (actions, deadlines, decisions, summary)
│   ├── buddyEngine.ts           # Local AI Buddy intent detection + response generation
│   ├── chatParser.ts            # Chat text/file parsing
│   ├── storage.ts               # localStorage read/write helpers
│   └── voice.ts                 # Speech recognition + synthesis wrappers
├── components/
│   ├── Layout.tsx               # Sidebar nav + page container
│   ├── RobotAvatar.tsx          # Animated robot with 4 states
│   ├── Badges.tsx               # CategoryBadge + PriorityBadge
│   ├── LanguageSelector.tsx     # Language dropdown
│   └── ImportChatModal.tsx      # Reusable import modal (paste/file/demo)
└── pages/
    ├── Onboarding.tsx           # 3-step first-run flow
    ├── Dashboard.tsx            # Overview + stats + quick actions
    ├── AIBuddyPage.tsx          # Chat with robot companion
    ├── ConversationsPage.tsx    # List + detail + analysis + import
    ├── StudentLifePage.tsx      # Student-focused briefing
    ├── SettingsPage.tsx         # All settings + data management
    └── PrivacyPage.tsx          # Privacy center
```

---

## Key User Flows

1. **First run:** Onboarding → pick language → load demo → meet AI Buddy → Dashboard
2. **Import chat:** Dashboard/Conversations/AI Buddy → Import button → paste text or upload file → auto-analyzed → visible in Dashboard stats and Conversations detail
3. **Ask AI Buddy:** AI Buddy page → type or speak question → get answer with source references → click "Show source" to see original message
4. **Student briefing:** Student Life page → toggle on → see urgent items, deadlines, tasks, requests → mark complete or view source
5. **Manage data:** Settings → clear history / delete conversations / reset all → Privacy Center for full explanation

---

## Build & Deploy

- `npm run build` — production build to `dist/`
- `npm run typecheck` — TypeScript type checking
- `npm run lint` — ESLint
- Deploy: static hosting (any CDN). No server-side requirements.
