import { useEffect, useMemo, useState } from 'react';
import { requestAnalyze } from './service';
import type { AnalyzeHistoryItem, AnalyzeResponse } from './types';

const HISTORY_KEY = 'factify.history';

function loadHistory(): AnalyzeHistoryItem[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as any[]) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(Boolean)
      .slice(0, 8)
      .map((x) => ({
        at: Number(x.at) || Date.now(),
        score: Number(x.score) || 0,
        preview: String(x.preview || ''),
        text: String(x.text || ''),
      }));
  } catch {
    return [];
  }
}

export function useAnalyze() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<AnalyzeHistoryItem[]>([]);

  const canAnalyze = useMemo(() => text.trim().length >= 20 && !loading, [text, loading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHistory(loadHistory());
  }, []);

  async function analyze() {
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    setLoading(true);
    try {
      const response = await requestAnalyze(text, controller.signal);
      if (!response.ok) {
        setError(response.message);
        return;
      }

      const next = response.data;
      setResult(next);

      if (typeof window !== 'undefined') {
        const item: AnalyzeHistoryItem = {
          at: Date.now(),
          score: next.score ?? 0,
          preview: text.trim().slice(0, 90),
          text,
        };
        const merged = [item, ...loadHistory()].slice(0, 8);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
        setHistory(merged);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('İstek zaman aşımına uğradı. Lütfen tekrar dene.');
      } else {
        setError('Bağlantı hatası oluştu. İnternetini kontrol edip tekrar dene.');
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  function clearHistory() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  return {
    text,
    setText,
    loading,
    error,
    result,
    history,
    canAnalyze,
    analyze,
    clearHistory,
  };
}

