import enStrings from '@/data/strings.en.json';
import hiStrings from '@/data/strings.hi.json';

export type Lang = 'en' | 'hi';

type NestedStrings = { [key: string]: string | NestedStrings };

const dictionaries: Record<Lang, NestedStrings> = {
  en: enStrings as NestedStrings,
  hi: hiStrings as NestedStrings,
};

/**
 * Resolves a dot-notated key (e.g. 'app.title' or 'categories.good')
 * from strings.{en,hi}.json.
 */
export function t(key: string, lang: Lang = 'en'): string {
  const dict = dictionaries[lang] || dictionaries.en;
  const parts = key.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  if (typeof current === 'string') {
    return current;
  }
  return key;
}

/**
 * Returns localized string from an object like { en: "...", hi: "..." } or plain string.
 */
export function getLocalizedText(
  value: string | Record<string, string> | undefined,
  lang: Lang = 'en',
  fallback = ''
): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[lang] || value.en || Object.values(value)[0] || fallback;
}
