/** Lightweight chat moderation (profanity / spam patterns). */

const BAD_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "damn",
  "cunt",
  "dick",
  "pussy",
  "nigger",
  "faggot",
  "хуй",
  "хуя",
  "хуе",
  "хуи",
  "пизд",
  "ебан",
  "ебат",
  "ёбан",
  "бля",
  "бляд",
  "сука",
  "мудил",
  "гандон",
  "пидор",
  "пидар",
  "шлюх",
  "ублюд",
];

const URL_SPAM = /(?:https?:\/\/|t\.me\/|telegram\.me\/)/i;

export type ModerationResult = {
  allowed: boolean;
  reason: string | null;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/[0-9@$]/g, (ch) => {
      const map: Record<string, string> = {
        "0": "о",
        "1": "i",
        "3": "е",
        "4": "а",
        "5": "s",
        "@": "а",
        $: "s",
      };
      return map[ch] ?? ch;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function moderateChatMessage(body: string): ModerationResult {
  const trimmed = body.trim();
  if (!trimmed) {
    return { allowed: false, reason: "empty" };
  }
  if (trimmed.length > 500) {
    return { allowed: false, reason: "too_long" };
  }
  if (URL_SPAM.test(trimmed)) {
    return { allowed: false, reason: "links" };
  }

  const norm = normalize(trimmed);
  for (const word of BAD_WORDS) {
    if (norm.includes(word)) {
      return { allowed: false, reason: "profanity" };
    }
  }

  if (/(.)\1{6,}/.test(trimmed)) {
    return { allowed: false, reason: "spam" };
  }

  return { allowed: true, reason: null };
}
