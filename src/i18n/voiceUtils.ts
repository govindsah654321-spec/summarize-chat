import type { LanguageCode } from '@/types';

export const SPEECH_LANG_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  ne: 'ne-NP',
};

export function getSpeechLang(lang: LanguageCode): string {
  return SPEECH_LANG_MAP[lang] || 'en-US';
}

export function getRecognitionLang(lang: LanguageCode): string {
  return SPEECH_LANG_MAP[lang] || 'en-US';
}

export function getClosestVoice(
  voices: SpeechSynthesisVoice[],
  lang: LanguageCode
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const target = getSpeechLang(lang);
  const targetPrefix = lang;

  const exact = voices.find((v) => v.lang === target);
  if (exact) return exact;

  const prefixMatch = voices.find((v) =>
    v.lang.toLowerCase().startsWith(targetPrefix.toLowerCase())
  );
  if (prefixMatch) return prefixMatch;

  const similar = voices.find((v) =>
    v.lang.toLowerCase().startsWith(targetPrefix.toLowerCase().slice(0, 2))
  );
  if (similar) return similar;

  return voices[0] || null;
}

export function getVoicesForLang(
  voices: SpeechSynthesisVoice[],
  lang: LanguageCode
): SpeechSynthesisVoice[] {
  const prefix = lang.toLowerCase();
  const matched = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(prefix)
  );
  return matched.length > 0 ? matched : voices;
}
