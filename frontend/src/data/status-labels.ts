/**
 * Status code display configuration.
 * Centralized definition for status labels and colors.
 * Supports i18n by switching the locale key.
 */

export type Locale = 'ko' | 'en';

interface StatusDef {
  color: string;
  labels: Record<Locale, string>;
}

const statusDefs: Record<string, StatusDef> = {
  S_IDL: {
    color: '#9b8e7e',
    labels: { ko: '대기', en: 'Idle' },
  },
  S_PRG: {
    color: '#3a7ca5',
    labels: { ko: '진행중', en: 'In Progress' },
  },
  S_STB: {
    color: '#5a8a5e',
    labels: { ko: '작업완료', en: 'Stable' },
  },
  S_ERR: {
    color: '#b54a3f',
    labels: { ko: '오류', en: 'Error' },
  },
  S_REV: {
    color: '#c47f17',
    labels: { ko: '검토필요', en: 'Review' },
  },
};

// ── Notice category labels ──

const categoryDefs: Record<string, Record<Locale, string>> = {
  NOTICE:   { ko: '공지사항', en: 'Notice' },
  ISSUE:    { ko: '이슈', en: 'Issue' },
  RISK:     { ko: '리스크', en: 'Risk' },
  MEMO:     { ko: '메모', en: 'Memo' },
};

const priorityDefs: Record<string, Record<Locale, string>> = {
  HIGH:   { ko: '높음', en: 'High' },
  MEDIUM: { ko: '보통', en: 'Medium' },
  LOW:    { ko: '낮음', en: 'Low' },
};

export function getCategoryLabel(code: string): string {
  const def = categoryDefs[code];
  if (!def) return code;
  return def[currentLocale] || def['en'] || code;
}

export function getCategoryLabelsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [code, def] of Object.entries(categoryDefs)) {
    map[code] = def[currentLocale] || def['en'] || code;
  }
  return map;
}

export function getPriorityLabel(code: string): string {
  const def = priorityDefs[code];
  if (!def) return code;
  return def[currentLocale] || def['en'] || code;
}

export function getPriorityLabelsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [code, def] of Object.entries(priorityDefs)) {
    map[code] = def[currentLocale] || def['en'] || code;
  }
  return map;
}

export const categoryOptions = Object.keys(categoryDefs);
export const priorityOptions = Object.keys(priorityDefs);

// Current locale — change this to switch display language
let currentLocale: Locale = 'ko';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getStatusLabel(code: string): string {
  const def = statusDefs[code];
  if (!def) return code;
  return def.labels[currentLocale] || def.labels['en'] || code;
}

export function getStatusColor(code: string): string {
  return statusDefs[code]?.color || '#9b8e7e';
}

export const statusOptions = Object.keys(statusDefs);

/** Build a Record for components that need the full map */
export function getStatusLabelsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [code, def] of Object.entries(statusDefs)) {
    map[code] = def.labels[currentLocale] || def.labels['en'] || code;
  }
  return map;
}

export function getStatusColorsMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [code, def] of Object.entries(statusDefs)) {
    map[code] = def.color;
  }
  return map;
}
