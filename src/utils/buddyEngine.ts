import type {
  Conversation,
  AnalysisResult,
  ActionItem,
  ChatMessage,
  BuddyMessage,
  LanguageCode,
  Deadline,
} from '@/types';
import { t } from '@/i18n/translations';

interface BuddyContext {
  conversations: Conversation[];
  analysis: Record<string, AnalysisResult>;
  language: LanguageCode;
}

interface BuddyReply {
  text: string;
  sourceMessageIds: string[];
  originalMessages: { sender: string; text: string; timestamp: number }[];
}

function findMessagesByIds(
  conversations: Conversation[],
  ids: string[]
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      map.set(msg.id, msg);
    }
  }
  return ids.map((id) => map.get(id)).filter(Boolean) as ChatMessage[];
}

function formatRelativeTime(ts: number, lang: LanguageCode): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor(diff / (1000 * 60));

  if (mins < 1) return t(lang, 'common.justNow');
  if (mins < 60) return `${mins} ${t(lang, 'common.minutesAgo')}`;
  if (hours < 24) return `${hours} ${t(lang, 'common.hoursAgo')}`;
  if (days < 2) return t(lang, 'common.yesterday');
  return `${days} ${t(lang, 'common.daysAgo')}`;
}

function getAllActionItems(ctx: BuddyContext): ActionItem[] {
  const items: ActionItem[] = [];
  for (const key of Object.keys(ctx.analysis)) {
    items.push(...ctx.analysis[key].actionItems);
  }
  return items;
}

function getAllDeadlines(ctx: BuddyContext): Deadline[] {
  const deadlines: Deadline[] = [];
  for (const key of Object.keys(ctx.analysis)) {
    deadlines.push(...ctx.analysis[key].deadlines);
  }
  return deadlines;
}

function searchMessages(
  ctx: BuddyContext,
  query: string,
  limit = 5
): { msg: ChatMessage; conv: Conversation; score: number }[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: { msg: ChatMessage; conv: Conversation; score: number }[] = [];

  for (const conv of ctx.conversations) {
    for (const msg of conv.messages) {
      const textLower = msg.text.toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (textLower.includes(word)) score += 1;
      }

      if (score > 0) {
        results.push({ msg, conv, score });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function getMostRecentConversation(ctx: BuddyContext): Conversation | null {
  if (ctx.conversations.length === 0) return null;
  return ctx.conversations[ctx.conversations.length - 1];
}

function detectIntent(query: string): string {
  const q = query.toLowerCase();

  if (/\b(?:miss|missed|yesterday|catch.?up|what happened|update)\b/i.test(q))
    return 'missed';
  if (/\b(?:important|priority|key|crucial|significant)\b/i.test(q))
    return 'important';
  if (/\b(?:deadline|due|when|date|schedule)\b/i.test(q)) return 'deadline';
  if (/\b(?:who asked|who told|who said|request|asked me)\b/i.test(q))
    return 'whoAsked';
  if (/\b(?:first|do first|priority|start|begin)\b/i.test(q)) return 'doFirst';
  if (/\b(?:simple|hindi|nepali|explain|translate|my language)\b/i.test(q))
    return 'explainSimple';
  if (/\b(?:friend|casual|like a friend|easy)\b/i.test(q)) return 'likeFriend';
  if (/\b(?:why.*urgent|urgent.*why|why.*important)\b/i.test(q))
    return 'whyUrgent';
  if (/\b(?:original|source|show.*message|raw)\b/i.test(q))
    return 'showOriginal';
  if (/\b(?:help|step.?by.?step|guide|don'?t understand|confused|stuck)\b/i.test(q))
    return 'helpStep';
  if (/\b(?:task|todo|to.?do|action items|what to do)\b/i.test(q))
    return 'tasks';
  if (/\b(?:exam|test|practical|quiz)\b/i.test(q)) return 'exam';
  if (/\b(?:meeting|meet|gather|call)\b/i.test(q)) return 'meeting';

  return 'search';
}

function replyMissed(ctx: BuddyContext): BuddyReply {
  const conv = getMostRecentConversation(ctx);
  if (!conv) return noContextReply(ctx.language);

  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  const recentMessages = conv.messages.filter(
    (m) => m.timestamp >= yesterday
  );

  if (recentMessages.length === 0) {
    const lastMessages = conv.messages.slice(-5);
    const sourceIds = lastMessages.map((m) => m.id);
    const sources = lastMessages.map((m) => ({
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
    }));

    const text =
      ctx.language === 'hi'
        ? `हाल ही की बातचीत में ये जरूरी बातें थीं:\n\n${sources
            .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 100)}`)
            .join('\n')}\n\nये सबसे नए संदेश हैं। कोई और सवाल है?`
        : ctx.language === 'ne'
        ? `भर्खरको कुराकानीमा यी महत्त्वपूर्ण कुराहरू थिए:\n\n${sources
            .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 100)}`)
            .join('\n')}\n\nयी सबैभन्दा नयाँ सन्देश हुन्। अर्को प्रश्न छ?`
        : `Here's what happened recently in your conversation:\n\n${sources
            .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 100)}`)
            .join('\n')}\n\nThese are the most recent messages. Want me to dig deeper into any of these?`;

    return { text, sourceMessageIds: sourceIds, originalMessages: sources };
  }

  const actionItems = getAllActionItems(ctx).filter(
    (item) => item.conversationId === conv.id && !item.completed
  );
  const sourceIds = recentMessages.slice(0, 5).map((m) => m.id);
  const sources = recentMessages.slice(0, 5).map((m) => ({
    sender: m.sender,
    text: m.text,
    timestamp: m.timestamp,
  }));

  let text: string;
  if (ctx.language === 'hi') {
    text = `कल से अब तक ${recentMessages.length} संदेश आए। ये जरूरी बातें हैं:\n\n`;
    if (actionItems.length > 0) {
      text += `**कार्य:**\n${actionItems
        .slice(0, 3)
        .map((a, i) => `${i + 1}. ${a.text.slice(0, 80)}`)
        .join('\n')}\n\n`;
    }
    text += `**ताज़ा संदेश:**\n${sources
      .slice(0, 3)
      .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 80)}`)
      .join('\n')}`;
  } else if (ctx.language === 'ne') {
    text = `हिजोदेखि अहिलेसम्म ${recentMessages.length} सन्देश आए। यी महत्त्वपूर्ण कुराहरू हुन्:\n\n`;
    if (actionItems.length > 0) {
      text += `**कार्यहरू:**\n${actionItems
        .slice(0, 3)
        .map((a, i) => `${i + 1}. ${a.text.slice(0, 80)}`)
        .join('\n')}\n\n`;
    }
    text += `**भर्खरका सन्देशहरू:**\n${sources
      .slice(0, 3)
      .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 80)}`)
      .join('\n')}`;
  } else {
    text = `There were ${recentMessages.length} messages since yesterday. Here's what you need to know:\n\n`;
    if (actionItems.length > 0) {
      text += `**Tasks:**\n${actionItems
        .slice(0, 3)
        .map((a, i) => `${i + 1}. ${a.text.slice(0, 80)}`)
        .join('\n')}\n\n`;
    }
    text += `**Recent messages:**\n${sources
      .slice(0, 3)
      .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 80)}`)
      .join('\n')}`;
  }

  return { text, sourceMessageIds: sourceIds, originalMessages: sources };
}

function replyImportant(ctx: BuddyContext): BuddyReply {
  const actionItems = getAllActionItems(ctx).filter((a) => !a.completed);
  const highPriority = actionItems.filter((a) => a.priority === 'high');

  if (highPriority.length === 0 && actionItems.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'अभी कोई जरूरी कार्य नहीं मिला।'
          : ctx.language === 'ne'
          ? 'अहिले कुनै जरुरी कार्य फेला परेन।'
          : "I couldn't find any high-priority items right now.",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const items = highPriority.length > 0 ? highPriority : actionItems;
  const top = items[0];
  const sources = findMessagesByIds(ctx.conversations, [top.messageId]).map(
    (m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })
  );

  const text =
    ctx.language === 'hi'
      ? `सबसे जरूरी बात: ${top.text.slice(0, 120)}\n\nयह ${top.assignedTo || 'किसी'} के लिए है। ${t('hi', 'buddy.showSource')} क्लिक करके मूल संदेश देखें।`
      : ctx.language === 'ne'
      ? `सबैभन्दा महत्त्वपूर्ण कुरा: ${top.text.slice(0, 120)}\n\nयो ${top.assignedTo || 'कसै'} को लागि हो। ${t('ne', 'buddy.showSource')} क्लिक गरेर मूल सन्देश हेर्नुहोस्।`
      : `The most important thing: ${top.text.slice(0, 120)}\n\nThis is for ${top.assignedTo || 'someone'}. Click "${t('en', 'buddy.showSource')}" to see the original message.`;

  return {
    text,
    sourceMessageIds: [top.messageId],
    originalMessages: sources,
  };
}

function replyDeadline(ctx: BuddyContext): BuddyReply {
  const deadlines = getAllDeadlines(ctx);
  const actionItems = getAllActionItems(ctx).filter(
    (a) => !a.completed && a.dueDate
  );

  const allDeadlines = [
    ...deadlines.map((d) => ({ date: d.date, text: d.text, messageId: d.messageId })),
    ...actionItems.map((a) => ({ date: a.dueDate, text: a.text, messageId: a.messageId })),
  ]
    .filter((d) => d.date && d.date > Date.now() - 86400000)
    .sort((a, b) => (a.date || 0) - (b.date || 0));

  if (allDeadlines.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'आपकी बातचीत में कोई आने वाली समयसीमा नहीं मिली।'
          : ctx.language === 'ne'
          ? 'तपाईंको कुराकानीमा कुनै आउने समयसीमा फेला परेन।'
          : "I couldn't find any upcoming deadlines in your conversations.",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const next = allDeadlines[0];
  const sources = findMessagesByIds(ctx.conversations, [next.messageId]).map(
    (m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })
  );

  const dateStr = next.date
    ? new Date(next.date).toLocaleDateString(
        ctx.language === 'hi' ? 'hi-IN' : ctx.language === 'ne' ? 'ne-NP' : 'en-US'
      )
    : 'N/A';

  const text =
    ctx.language === 'hi'
      ? `आपकी अगली समयसीमा: **${next.text.slice(0, 100)}**\n\nतारीख: ${dateStr}\n\n"${t('hi', 'buddy.showSource')}" पर क्लिक करके मूल संदेश देखें।`
      : ctx.language === 'ne'
      ? `तपाईंको अर्को समयसीमा: **${next.text.slice(0, 100)}**\n\nमिति: ${dateStr}\n\n"${t('ne', 'buddy.showSource')}" मा क्लिक गरेर मूल सन्देश हेर्नुहोस्।`
      : `Your next deadline: **${next.text.slice(0, 100)}**\n\nDate: ${dateStr}\n\nClick "${t('en', 'buddy.showSource')}" to see the original message.`;

  return {
    text,
    sourceMessageIds: [next.messageId],
    originalMessages: sources,
  };
}

function replyWhoAsked(ctx: BuddyContext): BuddyReply {
  const actionItems = getAllActionItems(ctx).filter(
    (a) => !a.completed && a.category === 'request'
  );
  const requests = actionItems.length > 0 ? actionItems : getAllActionItems(ctx).filter((a) => !a.completed);

  if (requests.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'किसी ने आपसे कोई काम नहीं कहा है (जितना मैंने देखा)।'
          : ctx.language === 'ne'
          ? 'कसैले तपाईंलाई कुनै काम भनेको छैन (जति मैले देखें)।'
          : "Nobody asked you to do anything (that I could find).",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const sources = findMessagesByIds(
    ctx.conversations,
    requests.map((r) => r.messageId)
  ).map((m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp }));

  const text =
    ctx.language === 'hi'
      ? `ये लोग आपसे कुछ करने के लिए कह रहे हैं:\n\n${sources
          .slice(0, 5)
          .map((s, i) => `${i + 1}. ${s.sender} ने कहा: ${s.text.slice(0, 80)}`)
          .join('\n')}`
      : ctx.language === 'ne'
      ? `यी मानिसहरूले तपाईंलाई केही गर्न भनेका छन्:\n\n${sources
          .slice(0, 5)
          .map((s, i) => `${i + 1}. ${s.sender} ले भने: ${s.text.slice(0, 80)}`)
          .join('\n')}`
      : `These people asked you to do something:\n\n${sources
          .slice(0, 5)
          .map((s, i) => `${i + 1}. ${s.sender} asked: ${s.text.slice(0, 80)}`)
          .join('\n')}`;

  return {
    text,
    sourceMessageIds: requests.map((r) => r.messageId),
    originalMessages: sources,
  };
}

function replyDoFirst(ctx: BuddyContext): BuddyReply {
  const actionItems = getAllActionItems(ctx).filter((a) => !a.completed);

  if (actionItems.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'अभी कोई बाकी कार्य नहीं है।'
          : ctx.language === 'ne'
          ? 'अहिले कुनै बाँकी कार्य छैन।'
          : "There are no pending tasks right now.",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const sorted = [...actionItems].sort((a, b) => {
    const aDate = a.dueDate || Infinity;
    const bDate = b.dueDate || Infinity;
    if (aDate !== bDate) return aDate - bDate;

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const top = sorted[0];
  const sources = findMessagesByIds(ctx.conversations, [top.messageId]).map(
    (m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })
  );

  const dateStr = top.dueDate
    ? new Date(top.dueDate).toLocaleDateString(
        ctx.language === 'hi' ? 'hi-IN' : ctx.language === 'ne' ? 'ne-NP' : 'en-US'
      )
    : null;

  const text =
    ctx.language === 'hi'
      ? `पहले यह करें: **${top.text.slice(0, 100)}**${dateStr ? `\n\nसमयसीमा: ${dateStr}` : ''}\n\nयह ${top.priority === 'high' ? 'जरूरी' : top.priority === 'medium' ? 'मध्यम' : 'कम'} प्राथमिकता का कार्य है।`
      : ctx.language === 'ne'
      ? `पहिले यो गर्नुहोस्: **${top.text.slice(0, 100)}**${dateStr ? `\n\nसमयसीमा: ${dateStr}` : ''}\n\nयो ${top.priority === 'high' ? 'जरुरी' : top.priority === 'medium' ? 'मध्यम' : 'कम'} प्राथमिकताको कार्य हो।`
      : `Do this first: **${top.text.slice(0, 100)}**${dateStr ? `\n\nDue: ${dateStr}` : ''}\n\nThis is a ${top.priority} priority task.`;

  return {
    text,
    sourceMessageIds: [top.messageId],
    originalMessages: sources,
  };
}

function replyExplainSimple(ctx: BuddyContext, query: string): BuddyReply {
  const results = searchMessages(ctx, query.replace(/simple|hindi|nepali|explain|translate|my language/gi, ''), 3);

  if (results.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'मुझे इस बारे में जानकारी नहीं मिली। क्या आप और विशेष बता सकते हैं?'
          : ctx.language === 'ne'
          ? 'मलाई यसबारे जानकारी फेला परेन। के तपाईं अझ विशेष बताउन सक्नुहुन्छ?'
          : "I couldn't find information about that. Could you be more specific?",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const top = results[0];
  const sources = [{ sender: top.msg.sender, text: top.msg.text, timestamp: top.msg.timestamp }];

  const simplifiedText = top.msg.text.slice(0, 150);

  const text =
    ctx.language === 'hi'
      ? `आसान शब्दों में: ${simplifiedText}\n\nमूल रूप से ${top.msg.sender} ने यह कहा था। अगर और सरल करना हो तो बताएं!`
      : ctx.language === 'ne'
      ? `सरल शब्दमा: ${simplifiedText}\n\nमूल रूपमा ${top.msg.sender} ले यो भनेका थिए। अझ सरल गर्नुपरे भन्नुहोस्!`
      : `In simple words: ${simplifiedText}\n\nBasically, ${top.msg.sender} said this. Let me know if you want it even simpler!`;

  return {
    text,
    sourceMessageIds: [top.msg.id],
    originalMessages: sources,
  };
}

function replyLikeFriend(ctx: BuddyContext, query: string): BuddyReply {
  const results = searchMessages(ctx, query.replace(/friend|casual|like a friend|easy/gi, ''), 3);

  if (results.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'दोस्त, मुझे इसके बारे में कुछ नहीं पता। थोड़ा और बताओ?'
          : ctx.language === 'ne'
          ? 'साथी, मलाई यसबारे थाहा छैन। अलिकति बताऊ?'
          : "Hey, I don't have info on that. Tell me a bit more?",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const top = results[0];
  const sources = [{ sender: top.msg.sender, text: top.msg.text, timestamp: top.msg.timestamp }];

  const text =
    ctx.language === 'hi'
      ? `सुनो, ${top.msg.sender} ने कहा: "${top.msg.text.slice(0, 120)}"\n\nआसान भाषा में — यह जरूरी है क्योंकि इसमें कोई काम या समयसीमा है। तुम्हें इस पर ध्यान देना चाहिए। और कुछ पूछना है?`
      : ctx.language === 'ne'
      ? `सुन, ${top.msg.sender} ले भने: "${top.msg.text.slice(0, 120)}"\n\nसरल भाषामा — यो महत्त्वपूर्ण छ किनभने यसमा कुनै कार्य वा समयसीमा छ। तपाईंले यसमा ध्यान दिनुपर्छ। अरू केही सोध्नु छ?`
      : `So, ${top.msg.sender} said: "${top.msg.text.slice(0, 120)}"\n\nIn plain terms — this matters because there's a task or deadline involved. You should pay attention to it. Anything else you want to know?`;

  return {
    text,
    sourceMessageIds: [top.msg.id],
    originalMessages: sources,
  };
}

function replyWhyUrgent(ctx: BuddyContext): BuddyReply {
  const highItems = getAllActionItems(ctx).filter(
    (a) => !a.completed && a.priority === 'high'
  );

  if (highItems.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'अभी कोई जरूरी कार्य नहीं है जिसका कारण समझाऊं।'
          : ctx.language === 'ne'
          ? 'अहिले कुनै जरुरी कार्य छैन जसको कारण बुझाऊं।'
          : "There are no urgent tasks right now for me to explain.",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const top = highItems[0];
  const sources = findMessagesByIds(ctx.conversations, [top.messageId]).map(
    (m) => ({ sender: m.sender, text: m.text, timestamp: m.timestamp })
  );

  const reasons: string[] = [];
  if (top.dueDate) {
    const daysLeft = Math.ceil((top.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 2) {
      reasons.push(
        ctx.language === 'hi'
          ? `समयसीमा बहुत करीब है (${daysLeft} दिन बाकी)`
          : ctx.language === 'ne'
          ? `समयसीमा धेरै नजिक छ (${daysLeft} दिन बाँकी)`
          : `The deadline is very close (${daysLeft} days left)`
      );
    }
  }
  if (/\b(?:exam|submission|deadline|project)\b/i.test(top.text)) {
    reasons.push(
      ctx.language === 'hi'
        ? 'यह परीक्षा या प्रोजेक्ट से जुड़ा है'
        : ctx.language === 'ne'
        ? 'यो परीक्षा वा प्रोजेक्टसँग सम्बन्धित छ'
        : "It's related to an exam or project"
    );
  }
  reasons.push(
    ctx.language === 'hi'
      ? 'संदेश में "urgent" या "asap" जैसे शब्द हैं'
      : ctx.language === 'ne'
      ? 'सन्देशमा "urgent" वा "asap" जस्ता शब्द छन्'
      : 'The message contains words like "urgent" or "asap"'
  );

  const text =
    ctx.language === 'hi'
      ? `यह कार्य जरूरी है क्योंकि:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n**कार्य:** ${top.text.slice(0, 100)}`
      : ctx.language === 'ne'
      ? `यो कार्य जरुरी छ किनभने:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n**कार्य:** ${top.text.slice(0, 100)}`
      : `This task is urgent because:\n\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n**Task:** ${top.text.slice(0, 100)}`;

  return {
    text,
    sourceMessageIds: [top.messageId],
    originalMessages: sources,
  };
}

function replyShowOriginal(ctx: BuddyContext, query: string): BuddyReply {
  const results = searchMessages(ctx, query, 1);

  if (results.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? 'मुझे कोई मूल संदेश नहीं मिला।'
          : ctx.language === 'ne'
          ? 'मलाई कुनै मूल सन्देश फेला परेन।'
          : "I couldn't find the original message.",
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const msg = results[0].msg;
  const sources = [{ sender: msg.sender, text: msg.text, timestamp: msg.timestamp }];

  const text =
    ctx.language === 'hi'
      ? `मूल संदेश ${msg.sender} का:\n\n"${msg.text}"`
      : ctx.language === 'ne'
      ? `${msg.sender} को मूल सन्देश:\n\n"${msg.text}"`
      : `Original message from ${msg.sender}:\n\n"${msg.text}"`;

  return {
    text,
    sourceMessageIds: [msg.id],
    originalMessages: sources,
  };
}

function replyHelpStep(ctx: BuddyContext, query: string): BuddyReply {
  const results = searchMessages(ctx, query.replace(/help|step.?by.?step|guide|don'?t understand|confused|stuck|assignment/gi, ''), 3);

  if (results.length === 0) {
    return {
      text:
        ctx.language === 'hi'
          ? `${t('hi', 'buddy.response.stepByStep')}\n1. बताएं किस असाइनमेंट की बात है\n2. मैं आपकी बातचीत में ढूंढूंगा\n3. फिर आसान चरणों में समझाऊंगा`
          : ctx.language === 'ne'
          ? `${t('ne', 'buddy.response.stepByStep')}\n1. बताउनुहोस् कुन असाइनमेन्टको कुरा हो\n2. म तपाईंको कुराकानीमा खोज्छु\n3. फेरि सजिलो चरणमा बुझाउँछु`
          : `${t('en', 'buddy.response.stepByStep')}\n1. Tell me which assignment you mean\n2. I'll search your conversations for it\n3. Then I'll break it down into easy steps`,
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const top = results[0];
  const sources = [{ sender: top.msg.sender, text: top.msg.text, timestamp: top.msg.timestamp }];

  const text =
    ctx.language === 'hi'
      ? `${t('hi', 'buddy.response.stepByStep')}\n\n1. ${top.msg.sender} ने कहा: "${top.msg.text.slice(0, 100)}"\n2. इसका मतलब है कि आपको यह काम करना है\n3. शुरू करने के लिए: पहले देखें कि क्या करना है, फिर एक-एक करके करें\n4. अगर कोई चरण समझ न आए, तो मुझसे पूछें!`
      : ctx.language === 'ne'
      ? `${t('ne', 'buddy.response.stepByStep')}\n\n1. ${top.msg.sender} ले भने: "${top.msg.text.slice(0, 100)}"\n2. यसको अर्थ तपाईंले यो काम गर्नुपर्छ\n3. सुरु गर्न: पहिले हेर्नुहोस् के गर्नुपर्छ, फेरि एक-एक गरेर गर्नुहोस्\n4. यदि कुनै चरण नबुझिए, मलाई सोध्नुहोस्!`
      : `${t('en', 'buddy.response.stepByStep')}\n\n1. ${top.msg.sender} said: "${top.msg.text.slice(0, 100)}"\n2. This means you need to do this task\n3. To start: first see what needs to be done, then do it step by step\n4. If any step is unclear, just ask me!`;

  return {
    text,
    sourceMessageIds: [top.msg.id],
    originalMessages: sources,
  };
}

function replySearch(ctx: BuddyContext, query: string): BuddyReply {
  const results = searchMessages(ctx, query, 5);

  if (results.length === 0) {
    return {
      text: t(ctx.language, 'buddy.response.noResults'),
      sourceMessageIds: [],
      originalMessages: [],
    };
  }

  const sources = results.map((r) => ({
    sender: r.msg.sender,
    text: r.msg.text,
    timestamp: r.msg.timestamp,
  }));

  const text =
    ctx.language === 'hi'
      ? `मुझे ये मिला:\n\n${sources
          .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 80)}`)
          .join('\n')}\n\nऔर जानना चाहते हैं?`
      : ctx.language === 'ne'
      ? `मलाई यी मिल्यो:\n\n${sources
          .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 80)}`)
          .join('\n')}\n\nअझ जान्न चाहनुहुन्छ?`
      : `Here's what I found:\n\n${sources
          .map((s, i) => `${i + 1}. ${s.sender}: ${s.text.slice(0, 80)}`)
          .join('\n')}\n\nWant to know more?`;

  return {
    text,
    sourceMessageIds: results.map((r) => r.msg.id),
    originalMessages: sources,
  };
}

function noContextReply(lang: LanguageCode): BuddyReply {
  return {
    text: t(lang, 'buddy.response.noData'),
    sourceMessageIds: [],
    originalMessages: [],
  };
}

export function generateBuddyReply(
  query: string,
  ctx: BuddyContext
): BuddyReply {
  if (ctx.conversations.length === 0) {
    return noContextReply(ctx.language);
  }

  const intent = detectIntent(query);

  switch (intent) {
    case 'missed':
      return replyMissed(ctx);
    case 'important':
      return replyImportant(ctx);
    case 'deadline':
      return replyDeadline(ctx);
    case 'whoAsked':
      return replyWhoAsked(ctx);
    case 'doFirst':
      return replyDoFirst(ctx);
    case 'explainSimple':
      return replyExplainSimple(ctx, query);
    case 'likeFriend':
      return replyLikeFriend(ctx, query);
    case 'whyUrgent':
      return replyWhyUrgent(ctx);
    case 'showOriginal':
      return replyShowOriginal(ctx, query);
    case 'helpStep':
      return replyHelpStep(ctx, query);
    case 'tasks':
      return replyDoFirst(ctx);
    case 'exam':
      return replyDeadline(ctx);
    case 'meeting':
      return replySearch(ctx, query);
    default:
      return replySearch(ctx, query);
  }
}

export function createBuddyMessage(
  role: 'user' | 'assistant',
  text: string,
  sourceMessageIds?: string[],
  originalMessages?: { sender: string; text: string; timestamp: number }[]
): BuddyMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    text,
    timestamp: Date.now(),
    sourceMessageIds,
    originalMessages,
  };
}
