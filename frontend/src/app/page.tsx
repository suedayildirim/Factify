'use client';

import { useMemo, useState } from 'react';

type Finding = { title: string; explanation: string; excerpt?: string };
type AnalyzeResponse = {
  score: number;
  language: Finding[];
  logic: Finding[];
  context: Finding[];
};

function ScoreColor({ score }: { score: number }) {
  const colorClass =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-lime-500' : score >= 35 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm font-semibold tracking-tight">Güven Skoru</div>
      <div className="text-sm text-slate-200">{score}%</div>
      <div className="ml-auto h-2 w-40 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function FindingsList({ items }: { items: Finding[] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-400">Uygun bulgu bulunamadı.</div>;
  }
  return (
    <div className="space-y-3">
      {items.map((f, idx) => (
        <div key={`${f.title}-${idx}`} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-sm font-semibold">{f.title}</div>
          {f.excerpt ? <div className="mt-1 text-xs text-slate-400">{f.excerpt}</div> : null}
          <div className="mt-2 text-sm text-slate-200">{f.explanation}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const canAnalyze = useMemo(() => text.trim().length >= 20 && !loading, [text, loading]);

  async function onAnalyze() {
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? 'Analiz sırasında hata oluştu.');
        return;
      }

      setResult(data as AnalyzeResponse);
    } catch {
      setError('İstek zaman aşımına uğradı ya da bağlantı kesildi.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  const score = result?.score ?? 0;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-5">
        <h1 className="text-3xl font-bold">Factify</h1>
        <p className="mt-1 text-slate-300">
          Şüpheli bir haber/iddia metnini yapıştır, Factify dil, mantık ve bağlam uyumunu
          analiz ederek sana bir <span className="font-semibold text-slate-200">Güven Skoru</span>{' '}
          sunar.
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-950/30 p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-200">Metin Girişi</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örneğin: 'Bu iddia şu sebeple kesinlikle doğrudur...' şeklinde şüpheli metni buraya yapıştır."
          className="min-h-40 w-full resize-none rounded-lg bg-slate-900 p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-1 ring-slate-800 focus:ring-slate-600"
          minLength={20}
          maxLength={10_000}
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-indigo-500"
          >
            {loading ? 'Analiz ediliyor...' : 'Analiz Başlat'}
          </button>
          {text.trim().length > 0 && text.trim().length < 20 ? (
            <div className="text-xs text-amber-300">En az 20 karakter gir.</div>
          ) : null}
          {error ? <div className="ml-auto text-xs text-rose-300">{error}</div> : null}
        </div>
      </section>

      {result ? (
        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-950/30 p-5">
          <ScoreColor score={score} />

          <div className="mt-5 grid gap-4 md:grid-cols-1">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Dil Analizi</h2>
              <FindingsList items={result.language} />
            </div>
            <div>
              <h2 className="mb-3 mt-2 text-sm font-semibold text-slate-200">Mantık Kontrolü</h2>
              <FindingsList items={result.logic} />
            </div>
            <div>
              <h2 className="mb-3 mt-2 text-sm font-semibold text-slate-200">Bağlamsal Doğrulama</h2>
              <FindingsList items={result.context} />
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/20 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
            <div className="text-sm text-slate-200">
              Metin analiz ediliyor... (hedef: {'<'} 5 saniye)
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

