import type { AnalyzeResponse } from './types';

export async function requestAnalyze(
  text: string,
  signal: AbortSignal
): Promise<{ ok: true; data: AnalyzeResponse } | { ok: false; message: string }> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return { ok: false, message: data?.message ?? 'Analiz sırasında hata oluştu.' };
  }

  return { ok: true, data: data as AnalyzeResponse };
}

