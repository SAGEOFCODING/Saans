import stringsEn from '../../data/strings.en.json';
import stringsHi from '../../data/strings.hi.json';

const RED_FLAG_REGEX =
  /\b(trouble\s+breathing|can'?t\s+breathe|cannot\s+breathe|difficulty\s+breathing|shortness\s+of\s+breath|gasping|breathless|chest\s+pain|tightness\s+in\s+chest|chest\s+pressure|faint(?:ing|ed)?|passed\s+out|loss\s+of\s+consciousness|blue\s+lips|cyanosis|blue\s+fingers|infant\s+wheezing|severe\s+child\s+symptoms)\b|(?:सांस|साँस).*(?:तकलीफ|कठिनाई|फूल|घुट|दिक्कत|नहीं)|सीने.*दर्द|छाती.*दर्द|बेहोश|नीले.*होंठ/i;

const BANNED_PATTERNS = [
  /\b(salbutamol|albuterol|budesonide|paracetamol|inhaler\s+dose|steroids?|antibiotics?)\b/i,
  /\b(take|dose|administer)\s+\d+\s*(mg|puffs?|tablets?|ml)\b/i,
  /\b\d+\s*(mg|puffs?)\b/i,
  /\b(cure|cures|prevent\s+disease|prevent\s+illness|treat\s+disease)\b/i,
  /\b(guarantee|will\s+protect|100%\s+safe)\b/i,
  /<script\b|<iframe\b|<img[^>]+onerror|javascript:|https?:\/\//i,
];

const STANDARD_NUMBERS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 24, 60, 100]);

export function checkInput(text: string, lang: 'en' | 'hi' = 'en'): { emergency: boolean; message?: string; sanitized: string } {
  const sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim().slice(0, 2000);
  if (RED_FLAG_REGEX.test(sanitized)) {
    const s = lang === 'hi' ? stringsHi : stringsEn;
    return { emergency: true, message: s.emergency.careLine, sanitized };
  }
  return { emergency: false, sanitized };
}

export function extractNumbers(text: string): number[] {
  const stripped = text.replace(/PM(?:2\.5|10)/gi, ' ');
  const matches = stripped.match(/\b\d+(?:\.\d+)?\b/g);
  return matches ? matches.map(Number).filter((n) => !Number.isNaN(n)) : [];
}

function extractAllowedNumbersFromUnknown(facts: unknown): Set<number> {
  const allowed = new Set(STANDARD_NUMBERS);
  if (!facts || typeof facts !== 'object') return allowed;
  const str = JSON.stringify(facts);
  const nums = extractNumbers(str);
  for (const n of nums) allowed.add(Math.round(n));
  return allowed;
}

export function validateChatOutput(text: string): { valid: boolean; sanitized: string } {
  let cleaned = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>/g, '').replace(/https?:\/\/\S+/gi, '');
  cleaned = cleaned.replace(/\bwill\s+protect\b/gi, 'can help lower');
  cleaned = cleaned.replace(/\bwill\s+reduce\b/gi, 'may reduce');
  for (const p of BANNED_PATTERNS) {
    if (p.test(cleaned)) return { valid: false, sanitized: cleaned };
  }
  return { valid: true, sanitized: cleaned };
}

export function validateOutput(
  output: unknown,
  facts?: unknown
): { valid: boolean; pass: boolean; error?: string; violations?: string[] } {
  const allowed = extractAllowedNumbersFromUnknown(facts);
  const text = typeof output === 'string' ? output : JSON.stringify(output);
  const violations: string[] = [];

  for (const p of BANNED_PATTERNS) {
    if (p.test(text)) violations.push(`Banned pattern detected: ${p.source}`);
  }

  const nums = extractNumbers(text);
  for (const n of nums) {
    const rounded = Math.round(n);
    if (!allowed.has(rounded) && !allowed.has(n)) {
      violations.push(`Unallowed number: ${n}`);
    }
  }

  // If structured narration, verify action IDs match exactly
  if (output && typeof output === 'object' && 'actions' in output && facts && typeof facts === 'object' && 'blocks' in facts) {
    const outputActions = ((output as { actions?: Array<{ id: string }> }).actions || []).map((a) => a.id);
    const expectedActions = ((facts as { blocks?: Array<{ actions?: Array<{ id: string }> }> }).blocks || []).flatMap(
      (b) => (b.actions || []).map((a) => a.id)
    );
    const outputSet = new Set(outputActions);
    if (outputActions.length !== expectedActions.length || expectedActions.some((id) => !outputSet.has(id))) {
      violations.push('Action IDs in narration do not match planned actions');
    }
  }

  const valid = violations.length === 0;
  return { valid, pass: valid, error: violations[0], violations };
}

export const validateNarration = validateOutput;
