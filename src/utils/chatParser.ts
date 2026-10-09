import type { ChatMessage, Conversation } from '@/types';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface ParsedLine {
  sender: string;
  text: string;
  timestamp: number;
}

/**
 * Parse raw chat text into structured messages.
 * Supports WhatsApp-style export formats:
 *   [date] sender: message
 *   sender: message (no date)
 *   dd/mm/yyyy, hh:mm - sender: message
 *   sender [time]: message
 * Also handles plain "Name: message" lines.
 */
function parseLines(raw: string): ParsedLine[] {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedLine[] = [];
  const now = Date.now();
  let currentSender = '';
  let currentText = '';
  let currentTime = now;

  const datePattern1 = /^(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-—]\s*(.+)$/;
  const datePattern2 = /^\[(.+?)\]\s*(.+)$/;
  const senderTimePattern = /^(.+?)\s*\[(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]:\s*(.+)$/;
  const simpleSenderPattern = /^([^:]+?):\s*(.+)$/;

  function flush() {
    if (currentSender && currentText) {
      results.push({
        sender: currentSender,
        text: currentText.trim(),
        timestamp: currentTime,
      });
    }
    currentText = '';
  }

  for (const line of lines) {
    let matched = false;

    const m1 = line.match(datePattern1);
    if (m1) {
      flush();
      const [, , , rest] = m1;
      const colonIdx = rest.indexOf(':');
      if (colonIdx > 0) {
        currentSender = rest.slice(0, colonIdx).trim();
        currentText = rest.slice(colonIdx + 1).trim();
        currentTime = now - results.length * 60000;
        matched = true;
      }
    }

    if (!matched) {
      const m2 = line.match(datePattern2);
      if (m2) {
        flush();
        const [, dateStr, rest] = m2;
        const colonIdx = rest.indexOf(':');
        if (colonIdx > 0) {
          currentSender = rest.slice(0, colonIdx).trim();
          currentText = rest.slice(colonIdx + 1).trim();
          const parsed = new Date(dateStr).getTime();
          currentTime = isNaN(parsed) ? now - results.length * 60000 : parsed;
          matched = true;
        }
      }
    }

    if (!matched) {
      const m3 = line.match(senderTimePattern);
      if (m3) {
        flush();
        const [, sender, , text] = m3;
        currentSender = sender.trim();
        currentText = text.trim();
        currentTime = now - results.length * 60000;
        matched = true;
      }
    }

    if (!matched) {
      const m4 = line.match(simpleSenderPattern);
      if (m4) {
        flush();
        const [, sender, text] = m4;
        currentSender = sender.trim();
        currentText = text.trim();
        currentTime = now - results.length * 60000;
        matched = true;
      }
    }

    if (!matched) {
      if (currentSender) {
        currentText += ' ' + line;
      }
    }
  }
  flush();

  return results;
}

export function parseChatText(
  raw: string,
  title?: string,
  sourceFileName?: string,
  isSample?: boolean
): Conversation {
  const parsed = parseLines(raw);
  const messages: ChatMessage[] = parsed.map((p) => ({
    id: genId(),
    sender: p.sender,
    text: p.text,
    timestamp: p.timestamp,
    isOwn: false,
  }));

  const inferredTitle =
    title ||
    sourceFileName?.replace(/\.[^.]+$/, '') ||
    (messages.length > 0
      ? `${messages[0].sender} & others`
      : 'Imported Conversation');

  return {
    id: genId(),
    title: inferredTitle,
    messages,
    importedAt: Date.now(),
    isSample,
    sourceFileName,
  };
}

export function parseChatFile(
  content: string,
  fileName: string
): Conversation {
  return parseChatText(content, undefined, fileName, false);
}
