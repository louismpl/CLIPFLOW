import type { Clip } from './gemini';

export interface AnalysisRecord {
  id: string;
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  clips: Clip[];
  query?: string;
  date: string; // ISO
}

interface CreditsData {
  remaining: number;
  month: string; // YYYY-MM
}

const HISTORY_KEY = 'clipflow_history';
const CREDITS_KEY = 'clipflow_credits';
const MAX_FREE_PER_MONTH = 3;

export function saveAnalysis(record: AnalysisRecord): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: AnalysisRecord[] = raw ? JSON.parse(raw) : [];
    history.unshift(record);
    // Keep last 20
    const trimmed = history.slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
}

export function getHistory(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCreditsData(): CreditsData {
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CreditsData;
      if (parsed && typeof parsed.remaining === 'number' && typeof parsed.month === 'string') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { remaining: MAX_FREE_PER_MONTH, month: getCurrentMonth() };
}

function setCreditsData(data: CreditsData): void {
  try {
    localStorage.setItem(CREDITS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getRemainingCredits(): number {
  const data = getCreditsData();
  const currentMonth = getCurrentMonth();
  if (data.month !== currentMonth) {
    return MAX_FREE_PER_MONTH;
  }
  return Math.max(0, data.remaining);
}

export function useCredit(): boolean {
  resetCreditsIfNewMonth();
  const data = getCreditsData();
  if (data.remaining > 0) {
    data.remaining -= 1;
    setCreditsData(data);
    return true;
  }
  return false;
}

export function resetCreditsIfNewMonth(): void {
  const data = getCreditsData();
  const currentMonth = getCurrentMonth();
  if (data.month !== currentMonth) {
    setCreditsData({ remaining: MAX_FREE_PER_MONTH, month: currentMonth });
  }
}
