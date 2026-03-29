import { useState, useEffect, useMemo, useCallback } from "react";
import { analyzeText } from "@/lib/analyze";
import type { AnalyzeHistoryItem, AnalyzeResponse } from "@/types/analyze";

const HISTORY_KEY = "factify.history";
const MAX_HISTORY = 8;

function loadHistory(): AnalyzeHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY).map((x: any) => ({
      at: Number(x.at) || Date.now(),
      score: Number(x.score) || 0,
      preview: String(x.preview || ""),
      text: String(x.text || ""),
    }));
  } catch {
    return [];
  }
}

export function useAnalyze() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<AnalyzeHistoryItem[]>([]);

  const canAnalyze = useMemo(() => text.trim().length >= 20 && !loading, [text, loading]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const analyze = useCallback(async () => {
    if (!canAnalyze) return;
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await analyzeText(text);
      setResult(response);

      const item: AnalyzeHistoryItem = {
        at: Date.now(),
        score: response.score,
        preview: text.slice(0, 80),
        text,
      };
      const updated = [item, ...history].slice(0, MAX_HISTORY);
      setHistory(updated);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      setError("Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [canAnalyze, text, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const loadFromHistory = useCallback((item: AnalyzeHistoryItem) => {
    setText(item.text);
  }, []);

  return { text, setText, loading, error, result, history, canAnalyze, analyze, clearHistory, loadFromHistory };
}
